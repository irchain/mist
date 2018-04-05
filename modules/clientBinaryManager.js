const _ = global._;
const Q = require("bluebird");
const fs = require("fs");
const { app, dialog } = require("electron");
const got = require("got");
const path = require("path");
const Settings = require("./settings");
const Windows = require("./windows");
const ClientBinaryManager = require("happyuc-client-binaries").Manager;
const EventEmitter = require("events").EventEmitter;

const log = require("./utils/logger").create("ClientBinaryManager");

// should be       'https://raw.githubusercontent.com/ethereum/mist/master/clientBinaries.json'
// TODO add happyuc clientBinaries.json url
const BINARY_URL = "";
// TODO modify regex rule
const ALLOWED_DOWNLOAD_URLS_REGEX = "";

class Manager extends EventEmitter {
  constructor() {
    super();

    this._availableClients = {};
  }

  init(restart) {
    log.info("Initializing...");

    // check every hour
    // setInterval(() => this._checkForNewConfig(true), 1000 * 60 * 60);

    return this._checkForNewConfig(restart);
  }

  getClient(clientId) {
    return this._availableClients[clientId.toLowerCase()];
  }

  _writeLocalConfig(json) {
    log.info("Write new client binaries local config to disk ...");

    fs.writeFileSync(path.join(Settings.userDataPath, "clientBinaries.json"), JSON.stringify(json, null, 2));
  }

  _checkForNewConfig(restart) {
    const nodeType = "Ghuc";
    let binariesDownloaded = false;
    let nodeInfo;

    log.info(`Checking for new client binaries config from: ${BINARY_URL}`);

    this._emit("loadConfig", "Fetching remote client config");

    // fetch config
    return got(BINARY_URL, { timeout: 3000, json: true })
      .then(res => {
        if (!res || _.isEmpty(res.body)) {
          throw new Error("Invalid fetch result");
        } else {
          return res.body;
        }
      })
      .catch(() => log.warn("Error fetching client binaries config from repo"))
      .then(latestConfig => {
        if (!latestConfig) return;

        let localConfig;
        let skipedVersion;
        const nodeVersion = latestConfig.clients[nodeType].version;
        this._emit("loadConfig", "Fetching local config");

        try {
          // now load the local json
          localConfig = JSON.parse(fs.readFileSync(path.join(Settings.userDataPath, "clientBinaries.json")).toString());
        } catch (err) {
          log.warn(`Error loading local config - assuming this is a first run: ${err}`);
          if (latestConfig) {
            localConfig = latestConfig;
            this._writeLocalConfig(localConfig);
          } else {
            throw new Error("Unable to load local or remote config, cannot proceed!");
          }
        }

        try {
          skipedVersion = fs.readFileSync(path.join(Settings.userDataPath, "skippedNodeVersion.json")).toString();
        } catch (err) {
          log.info("No \"skippedNodeVersion.json\" found.");
        }

        // prepare node info
        const platform      = process.platform
                                .replace("darwin", "mac")
                                .replace("win32", "win")
                                .replace("freebsd", "linux")
                                .replace("sunos", "linux"),
              binaryVersion = latestConfig.clients[nodeType].platforms[platform][process.arch],
              checksums     = _.pick(binaryVersion.download, "sha256", "md5"),
              algorithm     = _.keys(checksums)[0].toUpperCase(),
              hash          = _.values(checksums)[0];

        // get the node data, to be able to pass it to a possible error
        nodeInfo = { type: nodeType, version: nodeVersion, checksum: hash, algorithm };

        // if new config version available then ask user if they wish to update
        return latestConfig && JSON.stringify(localConfig) !== JSON.stringify(latestConfig) && nodeVersion !== skipedVersion ? new Q(
          resolve => {
            log.debug("New client binaries config found, asking user if they wish to update...");

            const wnd = Windows.createPopup("clientUpdateAvailable", {
              sendData: {
                uiAction_sendData: {
                  name       : nodeType,
                  version    : nodeVersion,
                  checksum   : `${algorithm}: ${hash}`,
                  downloadUrl: binaryVersion.download.url,
                  restart
                }
              }
            }, update => {
              if (update === "update") {
                // update
                this._writeLocalConfig(latestConfig);
                resolve(latestConfig);
              } else if (update === "skip") {
                // skip
                fs.writeFileSync(path.join(Settings.userDataPath, "skippedNodeVersion.json"), nodeVersion);
                resolve(localConfig);
              }
              wnd.close();
            });

            // if the window is closed, simply continue and as again next time
            wnd.on("close", () => resolve(localConfig));
          }) : localConfig;
      })
      .then(localConfig => {
        if (!localConfig) {
          log.info("No config for the ClientBinaryManager could be loaded, using local clientBinaries.json.");
          require("../clientBinaries.json");
        }

        // scan for node
        const mgr = new ClientBinaryManager(localConfig);
        mgr.logger = log;

        this._emit("scanning", "Scanning for binaries");

        return mgr
          .init({
            folders: [
              path.join(Settings.userDataPath, "binaries", "Ghuc", "unpacked"),
              path.join(Settings.userDataPath, "binaries", "Huc", "unpacked")]
          })
          .then(() => {
            const clients = mgr.clients;

            this._availableClients = {};

            const available = _.filter(clients, c => !!c.state.available);

            if (!available.length) {
              if (_.isEmpty(clients)) throw new Error("No client binaries available for this system!");

              this._emit("downloading", "Downloading binaries");
              return Q.map(_.values(clients), c => {
                binariesDownloaded = true;
                return mgr.download(c.id, {
                  downloadFolder: path.join(Settings.userDataPath, "binaries"), urlRegex: ALLOWED_DOWNLOAD_URLS_REGEX
                });
              });
            }
          })
          .then(() => {
            this._emit("filtering", "Filtering available clients");

            _.each(mgr.clients, client => {
              if (client.state.available) {
                const idlcase = client.id.toLowerCase();

                this._availableClients[idlcase] = {
                  binPath: Settings[`${idlcase}Path`] || client.activeCli.fullPath, version: client.version
                };
              }
            });

            // restart if it downloaded while running
            if (restart && binariesDownloaded) {
              log.info("Restarting app ...");
              app.relaunch();
              app.quit();
            }

            this._emit("done");
          });
      }).catch(err => {
        log.error(err);

        this._emit("error", err.message);

        // show error
        if (err.message.indexOf("Hash mismatch") !== -1) {
          // show hash mismatch error
          dialog.showMessageBox({
            type   : "warning",
            buttons: ["OK"],
            message: global.i18n.t("mist.errors.nodeChecksumMismatch.title"),
            detail : global.i18n.t("mist.errors.nodeChecksumMismatch.description", {
              type: nodeInfo.type, version: nodeInfo.version, algorithm: nodeInfo.algorithm, hash: nodeInfo.checksum
            })
          }, () => app.quit());
          // throw so the main.js can catch it
          throw err;
        }
      });
  }

  _emit(status, msg) {
    log.debug(`Status: ${status} - ${msg}`);
    this.emit("status", status, msg);
  }

  _resolveHucBinPath() {
    log.info("Resolving path to Huc client binary ...");

    let platform = process.platform;

    // "win32" -> "win" (because nodes are bundled by electron-builder)
    if (platform.indexOf("win") === 0) {
      platform = "win";
    } else if (platform.indexOf("darwin") === 0) {
      platform = "mac";
    }

    log.debug(`Platform: ${platform}`);
    let binPath = path.join(__dirname, "..", "nodes", "huc", `${platform}-${process.arch}`);
    if (Settings.inProductionMode) binPath = binPath.replace("nodes", path.join("..", "..", "nodes"));
    binPath = path.join(path.resolve(binPath), "huc");
    if (platform === "win") binPath += ".exe";
    log.info(`Huc client binary path: ${binPath}`);
    this._availableClients.huc = { binPath, version: "1.3.0" };
  }
}

module.exports = new Manager();
