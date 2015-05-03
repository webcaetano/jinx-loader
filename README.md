# [![Imgur](http://i.imgur.com/FHjshUv.png)](https://github.com/webcaetano/jinx)

Jinx loader is a [Jinx](https://github.com/webcaetano/jinx) Package loader [Kappa](http://static-cdn.jtvnw.net/emoticons/v1/25/1.0)

### Installation

```
npm install jinx-loader
```

### Usage 

```javascript
var jinxLoader = require('jinx-loader');

var mainFile = 'test/app/flash/main.as';
var pkgs = jinxLoader(mainFile);  
// return all .as and .swc files on node_modules
// jinx packages should be name with "jinx-" like "jinx-example"
```


---------------------------------

The MIT [License](https://raw.githubusercontent.com/webcaetano/jinx-loader/master/LICENSE.md)
