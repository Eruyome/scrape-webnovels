const request = require('request');
const fs = require('fs');
var rimraf = require("rimraf");
var globby = require('globby');
var sleep = require('sleep');
const os = require('os');

var _tmpDir = os.tmpdir() + "\\novel_pdfs"
try {
	rimraf.sync(_tmpDir);	
	rimraf.sync(__dirname + "\\chapters\\**", {
		glob: {
			ignore: `**/list.txt`
		}
	})
} catch (e) {}

var conversion = require("phantom-html-to-pdf")({
    phantomPath: require("phantomjs-prebuilt").path,
	tmpDir: _tmpDir
});

var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('chapters\\list.txt')
});

var last_url = "";
var chapters = [];
var chapter_count = 0;
var site = "";

lineReader.on('line', function (line) {
	var str = line;
	var path = str.split("/");
	var chapter_name = path[path.length - 1];
	var reg = /(wuxiaworld)/gi;
	var siteMatch = reg.exec(line);
	var site = (siteMatch[1]) ? siteMatch[1] : "";

	if (str.indexOf('http') > -1) {
		var obj = {}
		obj.chapter_name = chapter_name;
		obj.chapter_url = line; 
		chapters.push(obj);		
		chapter_count = chapters.length;
	}	
})

var cookieData = [];


// wuxiaworld cookies
if (true) {
	[{
		name: "consentId", //"cookie-name",
		value: "1cab86ba-eba3-4b9d-ab75-fe5b02db9830",  // "cookie-value",
		path: "/",
		domain: "www.wuxiaworld.com" // "domain.com"//Leave blank when working on localhost - "." will get prepended to domain
	},{
		name: "euconsent", //"cookie-name",
		value: "BOd1rQIOd1rQSAAAAAAACK-AAAAlx7_______9______5uz_Ov_v_f__33e8__9v_l_7_-___u_-33d4-_1vf99yfm1-7ftr3tp_87ues2_Xur__59__3z3_9phPrsks9IA",  // "cookie-value",
		path: "/",
		domain: "www.wuxiaworld.com" // "domain.com"//Leave blank when working on localhost - "." will get prepended to domain
	},{
		name: "gdpr", //"cookie-name",
		value: "consented",  // "cookie-value",
		path: "/",
		domain: "www.wuxiaworld.com" // "domain.com"//Leave blank when working on localhost - "." will get prepended to domain
	},{
		name: "m2hb", //"cookie-name",
		value: "enabled",  // "cookie-value",
		path: "/",
		domain: "www.wuxiaworld.com" // "domain.com"//Leave blank when working on localhost - "." will get prepended to domain
	},{
		name: "m2session", //"cookie-name",
		value: "5101a6e8-bb07-49bc-bd34-45e9d8c0ab36",  // "cookie-value",
		path: "/",
		domain: "www.wuxiaworld.com" // "domain.com"//Leave blank when working on localhost - "." will get prepended to domain
	},{
		name: "pg_variant", //"cookie-name",
		value: "test",  // "cookie-value",
		path: "/",
		domain: "www.wuxiaworld.com" // "domain.com"//Leave blank when working on localhost - "." will get prepended to domain
	},{
		name: "session_depth", //"cookie-name",
		value: "1",  // "cookie-value",
		path: "/",
		domain: "www.wuxiaworld.com" // "domain.com"//Leave blank when working on localhost - "." will get prepended to domain
	}];
}

lineReader.on('close', function() {	
	var processed_chapters = 0;
	var saved_chapters = 0;
	
	chapters.forEach(function(element) {
		var chapter_name = element.chapter_name;
		var chapter_url = element.chapter_url;
		try {
			conversion({
				html: '',
				header: '',
				footer: '',
				url: chapter_url, //set direct url instead of html
				printDelay: 0, //time in ms to wait before printing into pdf
				waitForJS: false, //set to true to enable programmatically specify (via Javascript of the page) when the pdf printing starts (see Programmatic pdf printing section for an example)
				//waitForJSVarName: //name of the variable that will be used as a printing trigger, defaults to "PHANTOM_HTML_TO_PDF_READY" (see Programmatic pdf printing section for an example)
				allowLocalFilesAccess: true, //set to true to allow request starting with file:///
				// see PhantomJS options for paperSize - http://phantomjs.org/api/webpage/property/paper-size.html
				paperSize: {
					format : "A4" , orientation : "portrait", margin : 0  //, width : 768 , height : 1024 //, headerHeight, footerHeight
				},
				fitToPage: true, //whether to set zoom if contents don't fit on the page
				customHeaders: [],
					cookies: cookieData,
				settings: {
					javascriptEnabled : true,
					resourceTimeout: 1000
				},
				// see phantomjs docs - http://phantomjs.org/api/webpage/property/viewport-size.html
				viewportSize: {
					width: 768,
					height: 1024
				},
				format: {
					quality: 100
				}
			}, function(err, pdf) {
				processed_chapters++
				console.log('Printing page for "' + chapter_name + '"...     ' + chapter_url)				
				var filename = __dirname + '/chapters/' + chapter_name + '.pdf';
				console.log(filename)
				console.log("----------------------")
				try {
				  fs.unlinkSync(filename);
				} catch (er) {
				  // handle the error
				}
				
				//console.log(pdf.logs);
				if (err) {
					console.log("-----------" + last_url + "-----------")
					console.log(err)  
				}
			  
				//console.log(pdf.numberOfPages);
				// since pdf.stream is a node.js stream you can use it
				// to save the pdf to a file (like in this example) or to
				// respond an http request.
				try {
					var output = fs.createWriteStream(filename)
					pdf.stream.pipe(output);
				} catch (error) {
					console.log(error)
				}

				done(chapter_count, processed_chapters)
			});	
		} catch (e) {
			console.log(e)
		}
	});
});

function done(chapter_count, processed_chapters) {
	if (processed_chapters >= chapter_count) {		
		console.log("chapter_count : " + chapter_count)
		console.log("processed_chapters : " + processed_chapters)
		//console.log("saved_chapters : " + saved_chapters)
		
		try {
			//rimraf.sync(_tmpDir);
		} catch (e) {}		
	} else {
		console.log("chapter_count : " + chapter_count + ", processed so far: " + processed_chapters)
	}
}


