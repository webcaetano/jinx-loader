var path = require('path');
var fs = require('fs');
var findup = require('findup-sync');
var globule = require('globule');

var ext = ['.jinx','.as','.js'];

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
	if(swc){
		if(path.extname(file)=='.swc' || !path.extname(file)) return true;
	} else {
		for(var i in ext) {
			if(path.extname(file)==ext[i]) return true;
		}
	}
	return false;
}

var tryExtentions = function(pkgPath){
	var pattern = [];
	for(var i in ext) pattern.push(path.join(path.dirname(pkgPath),'index'+ext[i]));
	var m = globule.find(pattern);

	return m.length ? [path.basename(m[0])] : [];
}

var countSWC = function(files){
	var resp = 0;
	for(var i in files){
		if(path.extname(files[i])=='.swc') ++resp;
	}
	return resp;
}

var getJinxPkgFiles = function(pkgs,swc,pkgPath){
	pkgs = arrayify(pkgs);
	var resp = [];
	for(var i in pkgs){
		if(pkgs[i].main && isCompatible(pkgs[i].main,swc)) resp.push(pkgs[i].main);
		if(pkgs[i].files) resp = resp.concat(getOnlyCompatible(pkgs[i].files,swc));
	}

	if(pkgPath && (!resp.length || countSWC(resp)==resp.length)){
		resp = tryExtentions(pkgPath);
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
	var config = findup('package.json',{cwd:options.config});
	var scope = arrayify(options.scope || ['dependencies', 'devDependencies', 'peerDependencies']);

	if (typeof config === 'string') config = require(path.resolve(config));

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

var isNodeModule = function(pkgs,module){
	return pkgs.indexOf(module)!=-1 && !module.match(/\.\//) && (path.extname(module)!='.as' && path.extname(module)!='.jinx');
}

module.exports = {
	main:function(modules,relativeTo){
		var root = path.resolve(path.dirname(findup('package.json',{cwd:relativeTo})),'node_modules');
		var i;
		var files = [];
    	var pkgs = getAllPkgsNames({
    		config:relativeTo
    	});

		for(i in modules){
			if(isNodeModule(pkgs,modules[i])){
				var pkgPath = path.join(root, modules[i], 'package.json');
				var pkgFile = JSON.parse(fs.readFileSync(pkgPath));
				var jinxPkgFiles = getJinxPkgFiles(pkgFile,false,pkgPath);
				if(jinxPkgFiles.length) files = files.concat(addPkgPath(jinxPkgFiles,path.join(root, modules[i])));
			} else {
				var filePath = path.resolve(path.dirname(relativeTo),modules[i]);
				files.push(path.extname(filePath)=='.as' || path.extname(filePath)=='.jinx' ? filePath : globule.find(filePath+".*")[0]);
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
    	var pkgs = getAllPkgsNames();

		for(i in modules){
			if(isNodeModule(pkgs,modules[i])){
				pkgsFiles.push(path.join(root, modules[i], 'package.json'));
			}
		}

		for(i in pkgsFiles){
			var jinxPkgFiles = getJinxPkgFiles(JSON.parse(fs.readFileSync(pkgsFiles[i])),true);
			if(jinxPkgFiles.length)files = files.concat(addPkgPath(jinxPkgFiles,path.dirname(pkgsFiles[i])));
		}

		for(i in files) files[i]=pathToSrcFile('./',files[i]);
		return files;
	}
}
