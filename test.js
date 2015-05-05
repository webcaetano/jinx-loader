'use strict';
var jinxLoader = require('./');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

describe('jinx-loader', function() {


	it('should find jinx-mempanel on node_modules and return the .as and the .swc', function(done) {

		var mainFile = 'test/app/flash/main.as';
		var pkgs = jinxLoader(mainFile);

		expect(pkgs.jinx).to.exist;
		expect(pkgs.swc).to.exist;
		expect(pkgs.jinx.length).to.be.at.least(1);
		expect(pkgs.swc.length).to.be.at.least(1);
		done();
	});
});
