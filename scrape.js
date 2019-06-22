const request = require('request');
const fs = require('fs');
const { fork } = require('child_process');

var url = ""
try {
  url = process.argv[2];
  if (typeof url === "undefined") {
    console.log("Wrong url, exiting script.");
    process.exit(0);
  }
} catch (err) {
  console.log(err)
}

var regex = /\:\/\/(.*?)\.(net|com|org|de)\//g;
var urlToplevel = regex.exec(url)
var fp = "";
switch (urlToplevel[1])  {
  case "wuxiaworld":
    fp = "scrape_wuxiaworld.js"
    break
  case "webnovel": 
    fp = "scrape_webnovelscom.js"
    break
  case "liberspark": 
    fp = "scrape_liberspark.js"
    break
  case "gravitytales": 
    fp = "scrape_gravitytales.js"
    break
  case "lightnovelstranslations": 
    fp = "scrape_lnt.js"
    break
  default: 
    fp = "";      
    break
}

if (fp.length) {
  console.log(`Executing script: ${fp}`);
  const nextScript = fork(`${fp}`, ["1"]);
  console.log("");
} else {
  console.log("Corresponding scrape script not found (" + urlToplevel + "), exiting script.");
  process.exit(0);
}
