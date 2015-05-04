var path = require('path');
var fs = require('fs');
var findup = require('findup-sync');
var globule = require('globule');

var pathToSrcFile = function(src,dest){
	var p = path.relative(path.dirname(src),path.dirname(dest)).split('\\').join('/');
	return (p && p.length ? p+'/'+path.basename(dest) : dest);
}

function arrayify(el) {
	return Array.isArray(el) ? el : [el];
}

var getOnlyCompatible = function(files){
	files = arrayify(files);
	var resp = [];
	for(var i in files){
		if(isCompatible(files[i])) resp.push(files[i]);
	}
	return resp;
}

var isCompatible = function(file){
	var ext = ['.as','.swc'];
	for(var i in ext) {
		if(path.extname(file)==ext[i]) return true;
	}
	return false;
}

var getJinxPkgFiles = function(pkgs){
	pkgs = arrayify(pkgs);
	var resp = [];
	for(var i in pkgs){
		if(pkgs[i].main && isCompatible(pkgs[i].main)) resp.push(pkgs[i].main);
		if(pkgs[i].files) resp = resp.concat(getOnlyCompatible(pkgs[i].files));
	}
	return removeEmpty(resp);
}

var removeEmpty = function(arr){
	for(var i in arr){
		if(Array.isArray(arr[i]) && !arr[i].length) arr.splice(arr.indexOf(arr[i]),1);
	}
	return arr;
}

var getJinxPkgsNames = function(options){
	options = options || {};

	var pattern = arrayify(options.pattern || ['jinx-*']);
	var config = options.config || findup('package.json');
	var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);

	if (typeof config === 'string') config = require(path.resolve(config));

	pattern.concat(['!jinx-loader']);

	var names = scope.reduce(function (result, prop) {
		return result.concat(Object.keys(config[prop] || {}));
	}, []);

	return globule.match(pattern, names)
}

var addPkgPath = function(files,pkgPath){
	files = arrayify(files);
	for(var i in files){
		files[i]=path.resolve(pkgPath+"/"+files[i]);
	}
	return files;
}


module.exports = function(relativeTo){
	var allFiles = [];
	var pkgs = ['../'].concat(getJinxPkgsNames());
	var root = path.resolve('node_modules');
	var i;
	var files = {as:[],swc:[]};

	for(i in pkgs){
		var pkgFile = JSON.parse(fs.readFileSync(path.join(root, pkgs[i], 'package.json')));
		var jinxPkgFiles = getJinxPkgFiles(pkgFile);
		if(jinxPkgFiles.length) allFiles = allFiles.concat(addPkgPath(jinxPkgFiles,path.join(root, pkgs[i])));
	}
	for(i in allFiles){
		if(path.extname(allFiles[i])=='.as'){
			files['as'].push(pathToSrcFile(relativeTo,allFiles[i]));
		} else {
			files['swc'].push(pathToSrcFile('./',path.dirname(allFiles[i])));
		}
	}

	return files;
}
