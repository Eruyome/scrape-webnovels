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
	https://lightnovelstranslations.com/<novel-name>/ page to get chapter list (html response)
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

// parse html to json
request(novelUrl, function (error, response, body) {
	if(typeof response !== 'undefined') {
		const $ = cheerio.load(response.body)

		var novel_title = $('meta[property="og:title"]').attr("content");

		const possibleChapterLinks = $('.status-publish').find('a');
		var chapters = [];
		$(possibleChapterLinks).each(function() {
			var url = $(this).attr("href");
			if (typeof url !== "undefined") {
				var obj = {};

				if (url.indexOf(novelUrl) > -1 && url.indexOf("chapter") > -1) {
					obj.url = url;
					var chap = $(this).text().trim();
					var regex = /(\d+).*?(\w.*)|(Chapter\s+?(\d+))/gis;
					var tmp_chap = regex.exec(chap);

					try {
						if (tmp_chap) {
							if (tmp_chap[1] && tmp_chap[2]) {					
								obj.chapter_number = tmp_chap[1].trim();
								obj.chapter_name = tmp_chap[2].trim();
							}
							else if (tmp_chap[4]) {						
								obj.chapter_number = tmp_chap[4].trim();
								obj.chapter_name = "";
							}	
						} else {
							var regex = /chapter-(\d+)-(.*)\//gis;
							var tmp_chap = regex.exec(url);
							obj.chapter_number = tmp_chap[1].trim();
							obj.chapter_name = tmp_chap[2].trim();
						}					
					} catch (e) {
						console.log(e)
						console.log(chap)
					}					
				}

				if (obj.url) {
					chapters.push(obj);
					urls.push(obj.url);
				}
			}
		})

		fs.writeFileSync(__dirname + '/chapters/data.json', JSON.stringify(chapters, null, 2) , 'utf-8');
		console.log('  Wrote url json.');

		var stream = fs.createWriteStream(__dirname + "/chapters/list.txt", {flags:'a'});
		stream.write("novel_name: " + novel_title + "\n");
		urls.forEach( function (item,index) {
			stream.write(item + "\n");
		});
		stream.end();

		console.log('  Wrote url list.');

		callNextScript(0);
	}
});

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