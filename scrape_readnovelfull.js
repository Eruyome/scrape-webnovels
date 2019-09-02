const request = require('request');
const fs = require('fs');
var util = require('util');
const cheerio = require('cheerio');
const path = require("path");
const { fork } = require('child_process');
const Confirm = require('prompt-confirm');

var nextScriptFiles = [];
nextScriptFiles.push({p: path.join(__dirname, "dl_html.js"), msg: ' Do you want to continue and download the html files/webpages?'});
nextScriptFiles.push({p: path.join(__dirname, "convert.js"), msg: ' Do you want to continue and convert the html files to pdf?'});

try {
	fs.unlinkSync(__dirname + '/chapters/list.txt');
	fs.unlinkSync(__dirname + '/chapters/data.json');
	console.log('  Successfully deleted chapters/list.txt and chapters/data.json');
} catch (err) {
	//console.log(err)
}

/*
	http://readnovelfull.com/<novel-name>.html/ page to get chapter list (html response)
*/
var novelUrl = ""
try {
	novelUrl = process.argv[2];
	if (typeof novelUrl === "undefined") {		
		console.log("No url passed, exiting script.");
		process.exit(0);
	}
} catch (err) {
	console.log(err)
}

var title = "";
var urls = [];

var globalChapters = [];
var globalUrls = [];

// parse html to json
request(novelUrl, function (error, response, body) {
	if(typeof response !== 'undefined') {
		const $ = cheerio.load(response.body);

		const novel_title = $('meta[name="og:title"]').attr('content');
		const novelID = $('#rating').attr('data-novel-id');

		var urlList = [];
		urlList.push("https://readnovelfull.com/ajax/chapter-archive?novelId=" + novelID)

		let p = Promise.resolve();
		p = p.then(() => {
			return write(urlList);
		}).then(() => {
			fs.writeFileSync(__dirname + '/chapters/data.json', JSON.stringify(globalChapters, null, 2) , 'utf-8');
			console.log('  Wrote url json.');

			var stream = fs.createWriteStream(__dirname + "/chapters/list.txt", {flags:'a'});
			stream.write("novel_name: " + novel_title + "\n");
			globalUrls.forEach( function (item,index) {
				stream.write(item + "\n");
			});
			stream.end();

			console.log('  Wrote url list.');

			callNextScript(0);
		});
	}
});

function parseHtml(response) {
	const $ = cheerio.load(response.body);

	const possibleChapterLinks = $('.panel-body').find('a');
	var chapters = [];

	$(possibleChapterLinks).each(function() {
		var obj = {};
		try {
			obj.url = "http://readnovelfull.com" + $(this).attr("href");
			var chap = $(this).attr("title");
			try {
				var tmp_chap = chap.replace(/Chatper(\s+?(\d+))/gi, "Chapter$1")
				tmp_chap = tmp_chap.match(/(.*?)[-:](.*)|(.*)/);
				if (tmp_chap[1]) {
					obj.chapter_number = tmp_chap[1].trim();
				} else if (tmp_chap[3]) {
					obj.chapter_number = tmp_chap[3].trim();
				}
				if (tmp_chap[2]) {
					obj.chapter_name = tmp_chap[2].trim();
				}			
			} catch(e) {
				console.log(e)
				console.log(chap)
			}
		} catch (err) {
			console.log(err)
		}

		if (obj.url) {
			globalChapters.push(obj);
			chapters.push(obj);
			globalUrls.push(obj.url);
		}
	});
}

function asyncFunctionCall(url) {
  return new Promise(resolve => {
    request(url, function (error, response, body) {
      if (typeof response !== 'undefined') {
        if ((response.statusCode >= 400 && response.statusCode <= 451)
        || (response.statusCode >= 500 && response.statusCode <= 511)) {
        	console.log('Bad response (' + response.statusCode + ') for: ' + url);
			resolve(true);
			return;
        }

        parseHtml(response)
      } else {
      	console.log('Undefined response for: ' + url);	
      }   
      resolve(false);
    });
  });
}

function write(list) { // gets called one after another
  const promises = [];  
  for(var key in list) {
    promises.push(asyncFunctionCall(list[key]));
  }
  return Promise.all(promises);
}


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
			const nextScript = fork(`${fp}`, ["1"]);
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

return