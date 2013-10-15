var request = require('supertest');
var should = require('should');
var app  = require(__dirname + '/../app');

var port = process.env.port || 3000;
var appdir = process.env.appdir || '/tmp';

var baseUrl = 'http://localhost:' + port;

describe('Dokkuweb', function () {

  describe('Middleware:', function () {
    var server = app;

    app.get('/NON-EXISTING-URL', function (req, res) {
      res.json(req.username);
    });

    it('Username should be available at all times', function (done) {
      request(app)
        .get('/NON-EXISTING-URL')
        .set('X-Forwarded-User', 'murdoc')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;
          res.body.should.equal('murdoc');
          done();
        });
    });

    it('returns 401 if auth header missing', function (done) {
      request(app)
        .get('/NON-EXISTING-URL')
        .expect(401, done);
    });
  });

  describe('API:', function () {
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


    describe('/users', function () {
      it('GET / returns 204', function (done) {
        request(baseUrl)
          .get('/users')
          .set('X-Forwarded-User', 'murdoc')
          .expect(204, done);
      });

      it('list SSH keys for user', function (done) {
        request(baseUrl)
          .get('/users/murdoc/keys')
          .set('X-Forwarded-User', 'murdoc')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;

            res.body.should
              .have.lengthOf(1);
            res.body[0].should
              .equal('2a:3b:be:07:16:b6:05:f7:d2:28:28:72:f2:48:5c:1a');
                                  
            done();
          });
      });

      it('can receive new SSH keys', function (done) {
        var newKey = {
          pubkey: "ssh-rsa 23456789abc murdoc@macG"
        };
        request(baseUrl)
          .post('/users/murdoc/keys')
          .set('X-Forwarded-User', 'murdoc')
          .send(newKey)
          .expect(302)
          .expect('Location', '/users/murdoc', done);
      });

      it('can follow link from root to logged in user', function (done) {
        request(baseUrl)
          .get('/')
          .set('X-Forwarded-User', 'murdoc')
          .end(function (err, res) {
            if (err) throw err;
            var authUserLink = res.body.users._links.authenticatedUser.href;
            request(baseUrl)
              .get(authUserLink)
              .set('X-Forwarded-User', 'murdoc')
              .expect({ username: 'murdoc' })
              .expect(200, done);
          });
      });
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
          .set('X-Forwarded-User', 'murdoc')
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
          .set('X-Forwarded-User', 'murdoc')
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
      it('returns has a link structure', function (done) {
        request(baseUrl)
          .get('/')
          .set('Accept', 'application/json')
          .set('X-Forwarded-User', 'murdoc')
          .expect(200)
          .end(function (err, res) {
            if (err) throw err;
            res.body.apps.should
              .have.property('_links')
              .with.property('self');

            // Should.JS v2 comes with .properties
            res.body.users.should
              .have.property('_links')
              .with.property('self');
            res.body.users.should
              .have.property('_links')
              .with.property('authenticatedUser');
            done();
          });
      });
    });
  });

});
    

