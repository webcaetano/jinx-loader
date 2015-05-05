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

var getOnlyCompatible = function(files,swc){
	files = arrayify(files);
	var resp = [];
	for(var i in files) if(isCompatible(files[i],swc)) resp.push(files[i]);
	return resp;
}

var isCompatible = function(file,swc){
	var ext = ['.jinx','.as'];
	if(swc){
		if(path.extname(file)=='.swc' || !path.extname(file)) return true;
	} else {
		for(var i in ext) {
			if(path.extname(file)==ext[i]) return true;
		}
	}
	return false;
}

var getJinxPkgFiles = function(pkgs,swc){
	pkgs = arrayify(pkgs);
	var resp = [];
	for(var i in pkgs){
		if(pkgs[i].main && isCompatible(pkgs[i].main,swc)) resp.push(pkgs[i].main);
		if(pkgs[i].files) resp = resp.concat(getOnlyCompatible(pkgs[i].files,swc));
	}
	return removeEmpty(resp);
}

var removeEmpty = function(arr){
	for(var i in arr){
		if(Array.isArray(arr[i]) && !arr[i].length) arr.splice(arr.indexOf(arr[i]),1);
	}
	return arr;
}

var getAllPkgsNames = function(options){
	options = options || {};

	var pattern = arrayify(options.pattern || ['*']);
	var config = options.config || findup('package.json');
	var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);

	if (typeof config === 'string') config = require(path.resolve(config));


	pattern.concat(['!jinx','!jinx-loader']);

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

function arrayify(el) {
	return Array.isArray(el) ? el : [el];
}

var pkgs = getAllPkgsNames();

var isNodeModule = function(module){
	return !(pkgs.indexOf(module)==-1 && (path.extname(module)=='.as' || path.extname(module)=='.jinx'))
}

module.exports = {
	main:function(modules,relativeTo){
		var root = path.resolve('node_modules');
		var i;
		var files = [];

		for(i in modules){
			if(isNodeModule(modules[i])){
				var pkgFile = JSON.parse(fs.readFileSync(path.join(root, modules[i], 'package.json')));
				var jinxPkgFiles = getJinxPkgFiles(pkgFile);
				if(jinxPkgFiles.length) files = files.concat(addPkgPath(jinxPkgFiles,path.join(root, modules[i])));
			} else {
				files.push(path.resolve(relativeTo,modules[i]))
			}
		}

		return files;
	},
	swc:function(modules){
		if(!modules) modules = [];
		var root = path.resolve('node_modules');
		var i;
		var files = [];
		var pkgsFiles = [path.join('./', 'package.json')];

		for(i in modules){
			if(isNodeModule(modules[i])){
				pkgsFiles.push(path.join(root, modules[i], 'package.json'));
			}
		}

		for(i in pkgsFiles){
			var jinxPkgFiles = getJinxPkgFiles(JSON.parse(fs.readFileSync(pkgsFiles[i])),true);
			if(isNodeModule(pkgsFiles[i])){
				if(jinxPkgFiles.length)files = files.concat(addPkgPath(jinxPkgFiles,path.dirname(pkgsFiles[i])));
			} else {
				files = files.concat(jinxPkgFiles);
			}
		}

		for(i in files) files[i]=pathToSrcFile('./',files[i]);
		return files;
	}
}
