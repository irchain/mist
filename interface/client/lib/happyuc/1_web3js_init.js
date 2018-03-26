// set providor
import * as Web3 from "web3";

if (typeof web3 !== 'undefined') {
  console.info('Web3 already initialized, re-using provider.');
  web3 = new Web3(web3.currentProvider);
} else {
  console.info('Web3 not yet initialized, doing so now with HttpProvider.');
  /** @namespace Web3.providers */
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}
