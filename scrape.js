const request = require('request');
const fs = require('fs');

try {
  fs.unlinkSync(__dirname + '/chapters/list.txt');
  console.log('  Successfully deleted chapters/list.txt');
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
    var data = JSON.parse(response.body)
    ids = getIds(data)
    title = data.data.bookInfo.bookName
    bookId = data.data.bookInfo.bookId

    urls = createUrls(title, bookId, ids)

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
