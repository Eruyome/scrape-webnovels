const request = require('request');
const fs = require('fs');
var yesno = require('yesno');
const path = require("path");
const { fork } = require('child_process');
const Confirm = require('prompt-confirm');

var nextScriptFiles = [];
nextScriptFiles.push({p: path.join(__dirname, "dl_html.js"), msg: ' Do you want to continue and download the html files/webpages?'});
nextScriptFiles.push({p: path.join(__dirname, "convert.js"), msg: ' Do you want to continue and convert the html files to pdf?'});

try {
  fs.unlinkSync(__dirname + '/chapters/list.txt');
  console.log('  Successfully deleted chapters/list.txt');
} catch (err) {
  // handle the error
}

/*
  gravitytales.com ajax request to get chapter list (html response)
*/
var url = "http://gravitytales.com/novel/way-of-choices/chapters"

var title = "";
var urls = [];

request(url, function (error, response, body) {
  if(typeof response !== 'undefined') {
    var data = response.body

    var re = /\/novel\/(.*)\//i;
    var m = re.exec(url);
    title = m[1];
    console.log("Novel name: " + title);

    var re = /class="tab-content"(.*)/igs;
    data = data.match(re);
    urls = extractUrls(data)

    var stream = fs.createWriteStream(__dirname + "/chapters/list.txt", {flags:'a'});
    stream.write("novel_name: " + title + "\n");
    urls.forEach( function (item,index) {
        stream.write(item + "\n");
    });
    stream.end();
    console.log('  Wrote url list.');
    callNextScript(0); 
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
/*
  for (var i = 0; i < cids.length; i++) {
    arr.push("https://www.webnovel.com/book/" + bookId + "/" + cids[i] + "/")
  }
  */

  var re = /(http.*)">/gi;  
  var m;

  do {
      m = re.exec(data);
      if (m) {
          arr.push(m[1]);
      }
  } while (m);

  return arr
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