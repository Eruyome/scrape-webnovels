const scrape = require('website-scraper');
const fs = require('fs');
var rimraf = require("rimraf");
var globby = require('globby');
const os = require('os');
var sleep = require('sleep');
var log = require('single-line-log').stdout;
const path = require("path");
const { fork } = require('child_process');
const Confirm = require('prompt-confirm');

var nextScriptFiles = [];
nextScriptFiles.push({p: path.join(__dirname, "convert.js"), msg: ' Do you want to continue and convert the html files to pdf?'});

var calledFromScript = process.argv[2];
if (typeof calledFromScript === "undefined") {
	calledFromScript = 0;
}

class MyPlugin {
	apply(registerAction) {
		registerAction('beforeStart', async ({options}) => {});

		registerAction('afterFinish', async () => {console.log("\nFinished scraping urls!")});

		registerAction('error', async ({error}) => {console.error(error)});

		registerAction('beforeRequest', ({resource, requestOptions}) => {
			//console.log(resource.getUrl())
			return {requestOptions};
		});

		registerAction('afterResponse', async ({response}) => {
			var contentType = response.headers["content-type"];
			var dots = [".", "..", "..."]
			if (response.statusCode !== 200 && contentType.indexOf("text/html") > -1 && !resource.url.trim().match(/\.(jpg|png|gif|eot|ttf)$/i)) {		
				log.clear();
				console.log(`Status code ${response.statusCode} when trying to dl ${response.request.headers.referer}, contentType: ${contentType}`)	
			} else {
				var rand = Math.floor(Math.random() * 3);	        		
				log('Handling responses ' + dots[rand]);
			}
			return response.body
		});

		registerAction('onResourceSaved', ({resource}) => {
			var last = resource.url.split('/').pop();
			var re = /\.(png|svg|css|ttf|eot|woff2|woff|jpg|jpeg|gif|js)|css\?|\?/i;
			if (!last.match(re)) {
				//console.log(`Resource ${resource.url} saved!`)
			}
		});

		registerAction('onResourceError', ({resource, error}) => {
			if (!resource.url.match(/\.(jpg)$/i)) {
				console.log(`Resource ${resource.url} has error ${error}`);
			}			
		});
		//registerAction('saveResource', async ({resource}) => {});
		//registerAction('generateFilename', async ({resource}) => {})
		//registerAction('getReference', async ({resource, parentResource, originalReference}) => {})
	}
}

try {
	rimraf.sync(__dirname + "\\html");
} catch (e) {}

try {
	var jsondata = JSON.parse(fs.readFileSync(__dirname + '\\chapters\\data.json'));
} catch(e) {}

try {
	var lineReader = require('readline').createInterface({
		input: require('fs').createReadStream(__dirname + '\\chapters\\list.txt')
	});
} catch(e) {}

var chapterArray = [];
var chapter_count = 0;
var site = "";

if (!Array.isArray(jsondata)) {
	lineReader.on('line', function (line) {		 
		var str = line;
		var path = str.split("/");
		var chapter_name = path[path.length - 1];

		var reg = /(wuxiaworld\.com|webnovel\.com)/gi;
		var siteMatch = reg.exec(line);
		if (siteMatch) {
			site = siteMatch[1];
		}

		if (str.indexOf('http') > -1) {
			var obj = {};
			obj.url = line;
			obj.filename = chapter_name.replace(/[\u4e00-\u9fff\u3400-\u4dff\uf900-\ufaff]/g, '');	// remove chinese characters; // doesn't work for all sites
			obj.filename = chapter_name.replace(/[^a-zA-Z0-9;,.:! "'+&()\\\/<>|^-_#$%]/gi, '');
			obj.filename = obj.filename.replace(/\(\)/g,'');
			chapterArray.push(obj);
			chapter_count = chapterArray.length;
		}
	})
} else {
	var chapterObj = [];
	for (key in jsondata) {
		var tmp = "";
		if (typeof jsondata[key].chapter_name !== "undefined") {
			jsondata[key].chapter_name = jsondata[key].chapter_name.replace(/[\u4e00-\u9fff\u3400-\u4dff\uf900-\ufaff]/g, '');
			jsondata[key].chapter_name = jsondata[key].chapter_name.replace(/[^a-zA-Z0-9;,.:! "'+&()\\\/<>|^-_#$%]/gi, '');
			jsondata[key].chapter_name = jsondata[key].chapter_name.replace(/\(\)/g,'');
			if (typeof jsondata[key].chapter_number === "undefined") {
				jsondata[key].chapter_number = "_"
			}
			tmp = jsondata[key].chapter_number + " - " + jsondata[key].chapter_name + ".html";
		} else {
			tmp = jsondata[key].chapter_number + ".html";
		} 

		tmp = tmp.replace(/[/\\?%*:|"<>]/g, '');
		if (typeof jsondata[key].chapter_number !== "undefined") {
			chapterObj.push({url: jsondata[key].url, filename: tmp});
		}
	}
	download(chapterObj, "json");
}

lineReader.on('close', function() {
	if (chapterArray.length) {
		download(chapterArray, "list");
	}	
});

return

function download(chapters, source) {
	// https://www.npmjs.com/package/website-scraper

	const options = {
		urls: chapters,
		directory: __dirname + "\\html\\",
		sources: [	
			{selector: 'img', attr: 'src'},
    		{selector: 'link[rel="stylesheet"]', attr: 'href'},
    		{selector: 'script', attr: 'src'}
		],
		subdirectories: [
			{directory: 'images', extensions: ['.jpg', '.png', '.svg']},
			{directory: 'js', extensions: ['.js']},
			{directory: 'css', extensions: ['.css']}
		],
		requestConcurrency: 4,
		ignoreErrors: false,
		plugins: [ new MyPlugin() ]
	};	

	// with promise
	scrape(options).then((result) => {
		htmlToPdf();
	});
}

function htmlToPdf() {
	if (calledFromScript) {
		process.exit(0)	
	} else {
		callNextScript(0);	
	}
};

function callNextScript(index) {
	console.log('');

	try {
		var fp = nextScriptFiles[index].p;
		var msg = nextScriptFiles[index].msg;
	} catch (e) {}

	if (typeof fp === "undefined") {
		process.exit(0);
	}

	var confirm = new Confirm(msg)
	.run()
	.then(function(answer) {
		if (answer) {
			console.log("");
			console.log(`Executing script: ${fp}`);     
			const nextScript = fork(`${fp}`);
			console.log("");

			nextScript.on('exit', function (code, signal) {
				//console.log('child process exited with ' + `code ${code} and signal ${signal}`);
				callNextScript(index + 1)
			});
		} else {
			console.log("Exiting script.");
			process.exit(0);
		}
	});
}