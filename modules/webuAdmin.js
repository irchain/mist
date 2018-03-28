module.exports = {
  extend: webu => {
    function insertMethod(name, call, params, inputFormatter, outputFormatter) {
      return new webu._extend.Method({
        name,
        call,
        params,
        inputFormatter,
        outputFormatter,
      });
    }

    function insertProperty(name, getter, outputFormatter) {
      return new webu._extend.Property({name, getter, outputFormatter});
    }

    // ADMIN
    webu._extend({
      property: 'admin',
      methods: [
        insertMethod(
          'addPeer',
          'admin_addPeer',
          1,
          [null],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod('exportChain', 'admin_exportChain', 1, [null], null),
        insertMethod('importChain', 'admin_importChain', 1, [null], null),
        insertMethod(
          'verbosity',
          'admin_verbosity',
          1,
          [webu._extend.utils.formatInputInt],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'setSolc',
          'admin_setSolc',
          1,
          [null],
          webu._extend.formatters.formatOutputString,
        ),
        insertMethod(
          'startRPC',
          'admin_startRPC',
          4,
          [null, webu._extend.utils.formatInputInteger, null, null],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'stopRPC',
          'admin_stopRPC',
          0,
          [],
          webu._extend.formatters.formatOutputBool,
        ),
      ],
      properties: [
        insertProperty(
          'nodeInfo',
          'admin_nodeInfo',
          webu._extend.formatters.formatOutputString,
        ),
        insertProperty('peers', 'admin_peers', null),
        insertProperty(
          'datadir',
          'admin_datadir',
          webu._extend.formatters.formatOutputString,
        ),
        insertProperty('chainSyncStatus', 'admin_chainSyncStatus', null),
      ],
    });

    // DEBUG
    webu._extend({
      property: 'debug',
      methods: [
        insertMethod(
          'printBlock',
          'debug_printBlock',
          1,
          [webu._extend.formatters.formatInputInt],
          webu._extend.formatters.formatOutputString,
        ),
        insertMethod(
          'getBlockRlp',
          'debug_getBlockRlp',
          1,
          [webu._extend.formatters.formatInputInt],
          webu._extend.formatters.formatOutputString,
        ),
        insertMethod(
          'setHead',
          'debug_setHead',
          1,
          [webu._extend.formatters.formatInputInt],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'processBlock',
          'debug_processBlock',
          1,
          [webu._extend.formatters.formatInputInt],
          null,
        ),
        insertMethod(
          'seedHash',
          'debug_seedHash',
          1,
          [webu._extend.formatters.formatInputInt],
          webu._extend.formatters.formatOutputString,
        ),
        insertMethod(
          'dumpBlock',
          'debug_dumpBlock',
          1,
          [webu._extend.formatters.formatInputInt],
          null,
        ),
      ],
      properties: [],
    });

    // MINER
    webu._extend({
      property: 'miner',
      methods: [
        insertMethod(
          'start',
          'miner_start',
          1,
          [webu._extend.formatters.formatInputInt],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'stop',
          'miner_stop',
          1,
          [webu._extend.formatters.formatInputInt],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'setExtra',
          'miner_setExtra',
          1,
          [null],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'setGasPrice',
          'miner_setGasPrice',
          1,
          [webu._extend.utils.fromDecimal],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'startAutoDAG',
          'miner_startAutoDAG',
          0,
          [],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'stopAutoDAG',
          'miner_stopAutoDAG',
          0,
          [],
          webu._extend.formatters.formatOutputBool,
        ),
        insertMethod(
          'makeDAG',
          'miner_makeDAG',
          1,
          [webu._extend.formatters.inputDefaultBlockNumberFormatter],
          webu._extend.formatters.formatOutputBool,
        ),
      ],
      properties: [
        insertProperty(
          'hashrate',
          'miner_hashrate',
          webu._extend.utils.toDecimal,
        ),
      ],
    });

    // NETWORK
    webu._extend({
      property: 'network',
      methods: [
        insertMethod(
          'getPeerCount',
          'net_peerCount',
          0,
          [],
          webu._extend.formatters.formatOutputString,
        ),
      ],
      properties: [
        insertProperty(
          'listening',
          'net_listening',
          webu._extend.formatters.formatOutputBool,
        ),
        insertProperty(
          'peerCount',
          'net_peerCount',
          webu._extend.utils.toDecimal,
        ),
        insertProperty('peers', 'net_peers', null),
        insertProperty(
          'version',
          'net_version',
          webu._extend.formatters.formatOutputString,
        ),
      ],
    });

    // TX POOL
    webu._extend({
      property: 'txpool',
      methods: [],
      properties: [insertProperty('status', 'txpool_status', null)],
    });
  },
};
