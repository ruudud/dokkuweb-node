var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var express = require('express');
var nconf = require('nconf');

var app = module.exports = express();

nconf.add('memory');
nconf.argv().env();

// Test specific overrides, should be a better place for this
app.configure('test', function () {
  nconf.defaults({
    appdir: './test/fixtures/appdir',
    gitref: 'gitdir/refs/heads/master',
    sshKeyCmd: './test/utils/fancyecho.sh',
  });
});

app.configure('production', function () {
  app.use(express.logger());

  nconf.defaults({
    port: 5000,
    appdir: '/home/git',
    gitref: '.git/refs/heads/master',
    sshKeyCmd: 'gitreceive',
  });
});


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

// Inject username into context
app.use(function (req, res, next) {
  var username = req.get('X-Forwarded-User');
  if (!username) {
    // This is really a server error, as the web server should handle this. 
    // I.e. we assume auth to be handled elsewhere.
    res.send(401, { error: 'Missing auth headers' });
  }
  req.username = username;
  next();
});

app.get('/users/:username/keys', function (req, res) {
  var user = req.params.username;
  var child = spawn(nconf.get('sshKeyCmd'), ['get-keys', user]);
  child.stdout.on('data', function (data) {
    var fingerprintStr = '' + data;
    var fingerprints = fingerprintStr.split('\n');
    // Lets remove the last element if it's empty
    if (fingerprints[fingerprints.length - 1] === '') {
      fingerprints.pop(); 
    }
    res.send(fingerprints);
  });
  child.on('error', function () {
    res.send(500, { error: 'Error when listing keys' });
  });
  child.on('exit', function (exitCode) {
    if (exitCode > 0) {
      res.send(500, { error: 'Error when listing keys' });
    }
  });
});

app.post('/users/:username/keys', function (req, res) {
  var user = req.params.username;
  var key = req.body.pubkey;
  var child = spawn(nconf.get('sshKeyCmd'), ['upload-key', user]);
  child.on('error', function () {
    res.send(500, { error: 'Error when adding key' });
  });
  child.on('exit', function (exitCode) {
    if (exitCode > 0) {
      res.send(500, { error: 'Error when adding key' });
    }
    res.redirect('/users/' + user);
  });
  child.stdin.setEncoding('utf-8');
  // dokku needs the key provded on its STDIN
  child.stdin.write(key);
  child.stdin.end();
});

app.get('/users/:username', function (req, res) {
  var user = { username: req.params.username };
  res.send(user);
});

app.get('/users', function (req, res) {
  res.send(204);
});

app.get('/apps', function (req, res) {
  var appdir = nconf.get('appdir'); 
  fs.readdir(appdir, function (err, files) {
    if (err) throw err;

    var apps = files.map(function (file) {
      return { name: file, path: path.join(appdir, file) };
    })
    .filter(function (app) {
      if ('.' === app.name[0]) return false;
      if (['ssl'].indexOf(app.name) > -1) return false;
      return fs.statSync(app.path).isDirectory();
    })
    .map(function (app) {
      var commitId = fs.readFileSync(path.join(app.path, nconf.get('gitref')), {
        encoding: 'utf8'
      });
      app.gitref = commitId;
      return app;
    });

    res.send(apps);
  });
});

app.get('/', function (req, res) {
  // HAL-style linking: http://stateless.co/hal_specification.html
  var links = {
    apps: { 
      _links: { 
        self: { href: "/apps/" } 
      }
    },
    users: { 
      _links: {
        self: { href: "/users/" },
        authenticatedUser: { href: "/users/" + req.username },
      }
    },
  };
  res.send(links);
});


// Do not start app if testing
if (!module.parent) {
  // Generic error handler
  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, 'Internal Server Error');
  });

  app.listen(nconf.get('port'));
  console.log('Listening on port %d', app.address().port);
}

