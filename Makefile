export NODE_ENV:=test
test:
	@appdir=./test/fixtures/appdir \
	gitref=gitdir/refs/heads/master \
	./node_modules/.bin/mocha 

watch:
	@appdir=./test/fixtures/appdir \
	gitref=gitdir/refs/heads/master \
	./node_modules/.bin/mocha -C -R min -w
 
.PHONY: test watch

