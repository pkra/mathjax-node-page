var fs = require('fs');
var mjpage = require('../lib/main.js').mjpage;

var input = fs.readFileSync('./test.html');
// TODO support html fragments


mjpage(input,{format: ["TeX"], singleDollars: true},{svg: true},function(output){
  console.log(output);
});
