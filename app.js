var express = require('express');

var app = module.exports = express();

app.use(function (req, res, next) {
  next();
});

app.get('/', function (req, res) {
  res.set('Content-Type', 'application/json');
  res.send('hello world');
});

// Do not start app if testing
if (!module.parent) {
  app.listen(5000);
}

