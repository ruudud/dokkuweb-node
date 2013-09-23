var request = require('supertest');
var should = require('should');
var app  = require(__dirname + '/../app');

var port = process.env.port || 3000;
var appdir = process.env.appdir || '/tmp';

var baseUrl = 'http://localhost:' + port;

describe('Dokkuweb', function () {
  var server;

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

  describe('/apps', function () {
    it('requires accept header', function (done) {
      request(baseUrl)
        .get('/apps')
        .set('Accept', 'bogus')
        .expect(406, done);
    });

    it('displays list of apps', function (done) {
      request(baseUrl)
        .get('/apps')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          res.body[0].should.have.property('name', 'testapp');
          res.body[0].should.have.property('path', 'test/fixtures/appdir/testapp');
          res.body.should.have.lengthOf(1);
          done();
        });
    });

    it('displays git ref for master ref', function (done) {
      request(baseUrl)
        .get('/apps')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          res.body[0].should.have.property('gitref', 'c0ffee');
          done();
        });
    });
  });

  describe('Root resource', function () {
    it('GET returns 204 OK', function (done) {
      request(baseUrl)
        .get('/')
        .set('Accept', 'application/json')
        .expect(204, done);
    });
  });

});
    

