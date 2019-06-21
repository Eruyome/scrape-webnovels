const fs = require('fs');
var sleep = require('sleep');
var rimraf = require("rimraf");
var globby = require('globby');
const HTML5ToPDF = require("html5-to-pdf");
const path = require("path");
const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');
const glob = require('glob');

var dir = path.join(__dirname, "html", "output");
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// https://www.npmjs.com/package/html5-to-pdf
async function convert(elements, index, steps) {
	if (elements[index]) {
		var filename = elements[index].replace(/\.html$/, "");
		var title = filename;
		var site = "";
		var useFooter = true;

		var includeFiles = [];

		try {
			var fileContent = fs.readFileSync(path.join(__dirname, "html", elements[index]), "utf8");

			var reg = /(wuxiaworld|webnovel|liberspark)\.com/gi;
			var siteMatch = reg.exec(fileContent);
			if (siteMatch) {
				site = siteMatch[1];
			}

			// set some variables depending on the website
			switch (site.toLowerCase())	{
				case "wuxiaworld":
					reg = /property="og:title.*?content="(.*?)".*?>/gis;
					m = reg.exec(fileContent);
					includeFiles = [
						path.join(__dirname, "html", "css", "main.css"),
						path.join(__dirname, "html", "css", "custom.css"),				
						path.join(__dirname, "templates", "wuxiaworld", "strip.css")
					]
					break
				case "webnovel": 
					reg = /j_chapIdx.*?>(.*?)<.*j_chapName.*?>(.*?)</gis;					
					includeFiles = [
						path.join(__dirname, "templates", "webnovel", "strip.css")
					];
					break
				case "liberspark": 
					reg = /property="og:title.*?content="(.*?)".*?>/gis;
					m = reg.exec(fileContent);
					//useFooter = false;		
					includeFiles = [
						path.join(__dirname, "templates", "liberspark", "strip.css"),
						path.join(__dirname, "templates", "liberspark", "strip.js")
					];
					break
				default: 
					title = "";				
					break
			}

			var m = reg.exec(fileContent);			
			if (m) {
				title = m[1];
				if (typeof m[2] !== "undefined") {
					title = title + m[2];
				}
				title = title;
			}
		} catch (error) {
			console.log(error)
		}
		
		var header = "<span class='title' style='font-size: 0px;'>" + title + "</span>";
		var footer = '<div style="font-size: 7px; width: 100%;"><span style="float:right; margin-right: 20px;"><span class="pageNumber"></span>/<span class="totalPages"></span></span></div>';

		var outPath = path.join(__dirname, "html", "output", filename + ".pdf");

		var html5ToPDF = new HTML5ToPDF({
			inputPath: path.join(__dirname, "html", elements[index]),
			outputPath: outPath,
			templatePath: path.join(__dirname, "html"),
			include: includeFiles,
			renderDelay: 5,
			pdf: {
				width: "6.8in",
				height: "9.0in",
				margin: {
					bottom: useFooter ? "1cm" : "0.5cm",
					top: useFooter ? "1cm" : "0.5cm" 
				},
				displayHeaderFooter: true,
				headerTemplate: header,
				footerTemplate: useFooter ? footer : '<div></div>',
			},
			launch : {
				defaultViewPort: {
					deviceScaleFactor: 2,
					hasTouch: true
				},
				ignoreHTTPSErrors : true,
			}
		})

		await html5ToPDF.start()
		await html5ToPDF.build()
		await html5ToPDF.close()

		// write metadata to add chapter title as document title
		if (fs.existsSync(outPath)) {
			// https://github.com/Sobesednik/node-exiftool#readme
			const ep = new exiftool.ExiftoolProcess(exiftoolBin);
			const metadata = {
				all: '', // remove all metadata at first
				Title: title,
				Copyright: '2019 ©',
				Creator: 'Mr Author',
			}

			ep
				.open()
				.then(() => ep.writeMetadata(outPath, metadata, ['codedcharacterset=utf8', 'overwrite_original']))
				//.then(console.log, console.error)
				.then(() => ep.close())
				.catch(console.error)
		}

		console.log(`Converted ${elements[index]} to pdf.`);
	}

	// recursively convert the next file in line
	var newIndex = index + steps;
	if (elements[newIndex]) {
		convert(elements, newIndex, steps);	
	} else if (elements.length - 1 == index) {
		await sleep(20000)
		var files = fs.readdirSync(path.join(__dirname, "html", "output"));

		var inputCount = elements.length;
		var outputCount = files.length;
		console.log(`\nOutput files (${outputCount}/${inputCount}).`);

		await sleep(1000)
		await compareFiles(files)
	}
}

try {
	function sleep(ms) {
		return new Promise(resolve=> {
			setTimeout(resolve,ms)
		})
	}
	function compareFiles(outputFiles) {
		return new Promise(resolve=> {	
			glob(__dirname + '/html/*.html', {}, function(err, files) {
				var inFiles = []
				var outFiles = []
				var missingFiles = []

				for (key in files) {
					var tmp1 = files[key].replace(/(.*)\/((?:[vV][1-9]\d?(?:-\d)?\/)?[^\/]+\.[^\.]+)$/gi, "$2")
					tmp1 = tmp1.replace(/\.html/gi, "")
					inFiles.push(tmp1)
				}
				for (key in outputFiles) {
					var tmp2 = outputFiles[key].replace(/(.*)\/((?:[vV][1-9]\d?(?:-\d)?\/)?[^\/]+\.[^\.]+)$/gi, "$2")
					tmp2 = tmp2.replace(/\.pdf/gi, "")
					outFiles.push(tmp2)
				}

				for (key in outFiles) {
					var found = false
					for (k in inFiles) {
						if (inFiles[k] == outFiles[key]) {
							found = true
							break
						}
					}
					if (!found) {
						missingFiles.push(outFiles[key])
					}
				}

				if (missingFiles.length) {
					console.log("")
					console.log("#### Missing output files: #####")
					console.log(missingFiles)
				}
			})

			console.log("\n###### PDF files should be ready to be merged, suggested software: PDFSam or something similiar.\n");
		})
	}

	// copy local font files over
	var fontFiles = fs.readdirSync(path.join(__dirname, "templates", "fonts"));
	fontFiles.forEach(function (file) {
		fs.copyFileSync(path.join(__dirname, "templates", "fonts", file), path.join(__dirname, "html", file));
	});

	// 
	var files = fs.readdirSync(path.join(__dirname, "html"));
	var EXTENSION = '.html';
	var targetFiles = files.filter(function(file) {
		return path.extname(file).toLowerCase() === EXTENSION;
	});

	try {
		rimraf.sync(path.join(__dirname, "html", "output") + "\\*.tmp")
	} catch (e) {}

	// call only a few in parallel and let them call one each on completion to prevent memory issues
	if ((targetFiles.length - 1) >= 5) {
		var steps = 5;
		convert(targetFiles, 0, steps)
		convert(targetFiles, 1, steps)
		convert(targetFiles, 2, steps)
		convert(targetFiles, 3, steps)
		convert(targetFiles, 4, steps)
	} else {
		convert(targetFiles, 0, 1)
	}
} catch (error) {
	console.error(error)
}