/**
 @module preloader PopupWindows
 */

require('./popupWindowsNoWebu.js');
require('./include/webuCurrentProvider.js');
const Q = require('bluebird');
const webuAdmin = require('../webuAdmin.js');
const https = require('https');

webuAdmin.extend(window.webu);

// make variables globally accessable
window.Q = Q;
window.https = https;

// Initialise the Redux store
window.store = require('./rendererStore');
