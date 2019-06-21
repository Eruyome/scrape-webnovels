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
  fs.unlinkSync(__dirname + '/chapters/list.json');
  console.log('  Successfully deleted chapters/list.txt and chapters/list.json');
} catch (err) {
  // handle the error
}

/*
  webnovels.com ajax request to get chapter list
*/
var url = "https://www.webnovel.com/apiajax/chapter/GetChapterList?_csrfToken=ONUFs2vCPFd2SUnoQtyev3XJO7yTUlRiLMe8bMfi&bookId=6838665602002805&_=1550770460837"

var ids = "";
var title = "";
var bookId = "";

var urls = [];

request(url, function (error, response, body) {
  if(typeof response !== 'undefined') {
    try {
      var data = JSON.parse(response.body)
    } catch (err) {
      console.log(err)
      console.log("\nAborted process, parsing the JSON data failed.")
      return
    }

    var ids = getIds(data)
    var title = data.data.bookInfo.bookName
    var bookId = data.data.bookInfo.bookId

    var urls = createUrls(title, bookId, ids)

    var stream = fs.createWriteStream(__dirname + "/chapters/list.txt", {flags:'a'});
    stream.write("novel_name: " + title + "\n");
    urls.forEach( function (item,index) {
        stream.write(item + "\n");
    });
    stream.end();
    console.log('  Wrote url list.');

    var chapters = createChapterObjects(data, title, bookId, ids);
    fs.writeFileSync(__dirname + '/chapters/data.json', JSON.stringify(chapters, null, 2) , 'utf-8');
    console.log('  Wrote url json.');

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

function createUrls(title, bookId, cids) {
  arr = []

  for (var i = 0; i < cids.length; i++) {
    arr.push("https://www.webnovel.com/book/" + bookId + "/" + cids[i] + "/")
  }

  return arr
}

function createChapterObjects(d, title, bookId, cids) {
  var arr = [];

  for (key in d.data.volumeItems) {
    for (k in d.data.volumeItems[key].chapterItems) {
      var obj = {};

      obj.chapter_name = d.data.volumeItems[key].chapterItems[k].name;
      obj.chapter_number = 'Chapter ' + d.data.volumeItems[key].chapterItems[k].index;
      obj.url = 'https://www.webnovel.com/book/' + bookId + "/" + d.data.volumeItems[key].chapterItems[k].id + "/";
      
      if (obj.url) {
        arr.push(obj);
      }
    }
  }

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