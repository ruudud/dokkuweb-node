export NODE_ENV:=test
test:
	@appdir=./test/fixtures/appdir \
	./node_modules/.bin/mocha 

watch:
	@appdir=./test/fixtures/appdir \
	./node_modules/.bin/mocha -C -R min -w
 
.PHONY: test watch

