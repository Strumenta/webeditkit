mkdir screenshots
node ../node_modules/mocha/bin/mocha --exit -r ts-node/register src/basic.ts && node ../node_modules/mocha/bin/mocha --exit -r ts-node/register src/intentions.ts
