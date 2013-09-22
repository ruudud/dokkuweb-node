var fs = require('fs');
var path = require('path');
var express = require('express');
var nconf = require('nconf');

nconf.argv()
nconf.env()
nconf.defaults({
  port: 5000,
  appdir: '/tmp/apps'
});

var app = module.exports = express();


// logger
if (nconf.get('NODE_ENV') !== 'test') {
  app.use(express.logger());
}
// gzip
app.use(express.compress());
// We only speak JSON
app.use(function (req, res, next) {
  if (!req.accepts('application/json')) {
    return res.send(406);
  }
  res.set('Content-Type', 'application/json');
  next();
});
app.use(express.json());
app.use(express.urlencoded());

app.get('/apps', function (req, res) {
  var appdir = nconf.get('appdir'); 
  fs.readdir(appdir, function (err, files) {
    if (err) throw err;

    var apps = files.map(function (file) {
      return { name: file, path: path.join(appdir, file) };
    })
    .filter(function (file) {
      return file.name !== 'ssl' && fs.statSync(file.path).isDirectory();
    });

    res.send(apps);
  });
});

app.get('/', function (req, res) {
  res.send(204);
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Internal Server Error');
});


// Do not start app if testing
if (!module.parent) {
  app.listen(nconf.get('port'));
  console.log('Listening on port ' + nconf.get('port'));
}

