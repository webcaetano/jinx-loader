'use strict';
var jinxLoader = require('./');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

describe('jinx-loader', function() {


	it('should find jinx-mempanel on node_modules and return the .as and the .swc', function(done) {

		var mainFile = 'test/app/test.jinx';
		var main = jinxLoader.main(['jinx-mempanel'],mainFile);
		var swc = jinxLoader.swc(['jinx-mempanel']);

		console.log(main)
		console.log(swc)
		expect(main).to.exist;
		expect(swc).to.exist;
		expect(main.length).to.be.at.least(1);
		expect(swc.length).to.be.at.least(1);
		done();
	});
});
