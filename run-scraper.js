const main = require('./src/main.js');

var configFileName = './config.json';
var runParallel = false;

var args = process.argv.slice(2, 10);

for (var i = 0; i < args.length; i++) {
  var arg = args[i];

  if (arg.indexOf('config=') !== -1) {
    var configFileName = arg.split('=')[1];
  } else if (arg.indexOf('parallel=') !== -1) {
    var runParallel = true;
  }
}

var configObject = require(configFileName);

main.run(configObject, runParallel);
