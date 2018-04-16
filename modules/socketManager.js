const _   = global._;
const Q   = require("bluebird");
const log = require("./utils/logger").create("Sockets");

const WebuIpcSocket  = require("./sockets/webuIpc");
const WebuHttpSocket = require("./sockets/webuHttp");

/**
 * `Socket` manager.
 */
class SocketManager {
  constructor() {
    this._sockets = {};
  }

  /**
   * Get socket with given id, creating it if it does not exist.
   *
   * @return {Socket}
   */
  create(id, type) {
    log.debug(`Create socket, id=${id}, type=${type}`);

    switch (type) {
      case "ipc":
        this._sockets[id] = new WebuIpcSocket(this, id);
        break;
      case "http":
        this._sockets[id] = new WebuHttpSocket(this, id);
        break;
      default:
        throw new Error(`Unrecognized socket type: ${type}`);
    }

    return this._sockets[id];
  }

  /**
   * Get socket with given id, creating it if it does not exist.
   *
   * @return {Socket}
   */
  get(id, type) {
    if (!this._sockets[id]) {
      this.create(id, type);
    }

    return this._sockets[id];
  }

  /**
   * @return {Promise}
   */
  destroyAll() {
    log.info("Destroy all sockets");

    return Q.all(_.map(this._sockets, (s, id) => {
      this.remove(id);
      return s.destroy();
    }));
  }

  /**
   * Remove socket with given id from this manager.
   *
   * Usually called by `Socket` instances when they're destroyed.
   */
  remove(id) {
    log.debug(`Remove socket, id=${id}`);

    delete this._sockets[id];
  }
}

module.exports = new SocketManager();
