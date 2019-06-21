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
	liberspark page to get chapter list (html response)
*/
var url = ""
try {
	url = process.argv[2];
	if (typeof url === "undefined") {
		url = "http://liberspark.com/novel/grasping-evil"
	}
} catch (err) {
	console.log(err)
}

var title = "";
var urls = [];

// parse html to json
request(url, function (error, response, body) {
	if(typeof response !== 'undefined') {
		const $ = cheerio.load(response.body)

		var novel_title = $('meta[property="og:title"]').attr("content");

		const chapterTable = $('#novel-chapters-list');
		const chapterItems = $(chapterTable).find('.chapter-link-container');

		var chapters = [];
		$(chapterItems).each(function() {
			var obj = {};
			try {
				// http://liberspark.com/read/grasping-evil/chapter-1712
				obj.url = $(this).find('a').attr("href");
				var chap = $(this).find('a > p').text().trim();
				try {
					var tmp_chap = chap.match(/((\d+)(?:\s*)?(\((?:\d+|\w)\))?)/);
					if (tmp_chap[2] && tmp_chap[3]) {						
						obj.chapter_number = tmp_chap[2].trim() + " " + tmp_chap[3].trim();
					}
					else if (tmp_chap[1]) {						
						obj.chapter_number = tmp_chap[1].trim();
					}
				} catch(e) {
					console.log(e)
					console.log(chap)
				}

				try {
					obj.chapter_name = chap.match(/(:|-)(.*)/)[2].trim();
				} catch(e) {}
			} catch (err) {
				console.log(err)
			}

			if (obj.url) {
				chapters.push(obj);    
			}
		});

		fs.writeFileSync(__dirname + '/chapters/data.json', JSON.stringify(chapters, null, 2) , 'utf-8');
		console.log('  Wrote url json.');

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

// parse html to simple list
request(url, function (error, response, body) {
	if (typeof response !== 'undefined') {
		var data = response.body

		var re = /\/novel\/(.*)/i;
		var m = re.exec(url);
		title = m[1];
		console.log("  **Novel name**: " + title);

		var re = /id=".*?novel-chapters-list/igs;
		data = data.match(re);
		urls = extractUrls(data);

		var stream = fs.createWriteStream(__dirname + "/chapters/list.txt", {flags:'a'});
		stream.write("novel_name: " + title + "\n");
		urls.forEach( function (item,index) {
			stream.write(item + "\n");
		});
		stream.end();

		console.log('  Wrote url list.');
	}
});

return

function extractUrls(data) {
	arr = []

	var re = /<a.*?href="http:\/\/liberspark\.com\/read\/(.*?)">/gis;
	var m;

	do {
		m = re.exec(data);
		if (m) {
			arr.push("http://liberspark.com/read/" + m[1]);
		}
	} while (m);

	return arr
}