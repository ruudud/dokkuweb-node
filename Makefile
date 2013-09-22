test:
	@./node_modules/.bin/mocha 

watch:
	@./node_modules/.bin/mocha -w
 
.PHONY: test watch

