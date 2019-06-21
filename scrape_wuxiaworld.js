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
  wuxiaworld.com ajax request to get chapter list (html response)
*/
var url = ""
try {
	url = process.argv[2];
	if (typeof url === "undefined") {
		url = "https://www.wuxiaworld.com/novel/martial-world"
		url = "https://www.wuxiaworld.com/novel/a-will-eternal"
		url = "https://www.wuxiaworld.com/novel/desolate-era"
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

		const accordion = $('#accordion');
		const panels = $(accordion + ' > .panel');
		const chapterItems = $(panels).find('.chapter-item');

		var chapters = [];
		$(chapterItems).each(function() {
			var obj = {};
			try {
				obj.url = 'https://www.wuxiaworld.com' + $(this).find('a').attr("href");
				var chap = $(this).find('a > span').text();
				try {
					var tmp_chap = chap.match(/(.*?)(:|-)|(.*)/)
					if (tmp_chap[1]) {
						obj.chapter_number = tmp_chap[1].trim();
					} else if (tmp_chap[3]) {
						obj.chapter_number = tmp_chap[3].trim();	
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
		
		//console.log(chapters)
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
	if(typeof response !== 'undefined') {
		var data = response.body

		var re = /\/novel\/(.*)/i;
		var m = re.exec(url);
		title = m[1];
		console.log("  **Novel name**: " + title);

		var re = /list-chapters(.*?)id="wuxiaworld/igs;
		data = data.match(re);
		urls = extractUrls(data)

		var stream = fs.createWriteStream(__dirname + "/chapters/list.txt", {flags:'a'});
		stream.write("novel_name: " + title + "\n");
		urls.forEach( function (item,index) {
			stream.write(item + "\n");
		});
		stream.end();

		// parsing to object fails for some chapter items, no idea why
		/*
		var obj = {};
		obj.novel_name = title;
		obj.chapterlist = extractUrlsToObj(data);
		fs.writeFileSync(__dirname + '/chapters/data.json', JSON.stringify(obj, null, 2) , 'utf-8'); 
		*/

		console.log('  Wrote url list.');
	}
});

return

function getIds(d) {
	var ids = [];
	var volumes = [];
	for (key in d.data.volumeItems) {
		volumes.push(d.data.volumeItems[key].chapterItems)
	}

	for (var i = 0; i < volumes.length; i++) {    
		for (var j = 0; j < volumes[i].length; j++) {
			ids.push(volumes[i][j].id)      
		}
	}
	//console.log(ids)
	return ids
}

function extractUrls(data) {
	arr = []

	var re = /<a href="(\/novel\/.*)">/gi;
	var m;

	do {
		m = re.exec(data);
		if (m) {
			arr.push("https://www.wuxiaworld.com" + m[1]);
		}
	} while (m);

	return arr
}


function extractUrlsToObj(data) {
	arr = []

	var r = /li.*?chapter-item.*?>(.*?)<\/li>/gis;
	var re = /<a href="(\/novel\/.*)">/gis;
	var reg = /span>(Chapter.*?)</gis;

	var o;
	var m;
	var n;

	do {
		o = r.exec(data);
		if (o) {
			m = re.exec(o[1]);
			n = reg.exec(o[1]);
			var obj = {};

			/* buggy
			if (o[1].indexOf("Chapter 2:") > - 1) {
				console.log(o[1])
				console.log(m)
				console.log(n)
			}
			*/

			if (m) {
				obj.url = "https://www.wuxiaworld.com" + m[1];
			}
			if (n) {
				obj.chapter = n[1];
			}
			if (m || n) {
				arr.push(obj);
			}
		}
	} while (o);

	return arr
}
