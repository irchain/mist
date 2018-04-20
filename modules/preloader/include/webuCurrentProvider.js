/**
 Sets the happyUC provider, as well as "webu" for backwards compatibility.

 @module happyUCProvider
 */
const Webu = require('webu');
const BigNumber = require('bignumber.js');
const ipcProviderWrapper = require('../../ipc/ipcProviderWrapper.js');
const LegacyWebuIpcProvider = require('./legacyWebuIpcProvider.js');

// SET ETHEREUM PROVIDER
// window.happyucProvider = new Webu.providers.IpcProvider('', ipcProviderWrapper);

// LEGACY
window.BigNumber = BigNumber;
window.webu = {
  currentProvider: new LegacyWebuIpcProvider('', ipcProviderWrapper),
};

// for now still add this too: WILL BE REMOVED with webu 1.0
window.webu = new Webu(new Webu.providers.IpcProvider('', ipcProviderWrapper));
