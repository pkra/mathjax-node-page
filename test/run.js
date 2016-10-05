var fs = require('fs');
var mjpage = require('./main.js').mjpage;

var input = fs.readFileSync('test.html');
// TODO support html fragments


mjpage(input,{},{html: true},function(output){
  console.log(output);
});
