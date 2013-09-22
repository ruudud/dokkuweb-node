var request = require('supertest');
var should = require('should');
var app  = require(__dirname + '/../app');
var port = 3333;

var baseUrl = 'http://localhost:' + port;
var server;

describe('app', function () {

  before(function (done) {
    server = app.listen(port, function (err, result) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });
 
  after(function (done) {
    server.close();
    done();
  });


  it('GET /', function (done) {
    request(baseUrl)
      .get('/')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done)
  });

});
    

