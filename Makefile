export NODE_ENV:=test
test:
	./node_modules/.bin/mocha 

watch:
	./node_modules/.bin/mocha -C -R min -w
 
.PHONY: test watch

