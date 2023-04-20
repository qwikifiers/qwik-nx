// This script is used as a runtime input for the Nx cache.
const { execSync } = require('child_process');
const os = require('os');
const yargs = require('yargs');
// Things like the version of NodeJS, whether we are running Windows or not, can affect
// the results of the computation but cannot be deduced statically.

let { type } = yargs(process.argv).argv;

if (type === 'os') {
  console.log(os.type());
} else if (type === 'node') {
  const v = execSync('node -v').toString();
  console.log(v.split('.')[0]);
} else {
  throw new Error('Could not resolve the "type" arg.');
}
