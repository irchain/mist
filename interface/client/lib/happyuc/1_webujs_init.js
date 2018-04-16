// set providor
// import * as Webu from 'webu';

if (typeof webu !== 'undefined') {
  console.info('Webu already initialized, re-using provider.');
  webu = new Webu(webu.currentProvider);
} else {
  console.info('Webu not yet initialized, doing so now with HttpProvider.');

  webu = new Webu(new Webu.providers.HttpProvider('http://localhost:8545'));
}
