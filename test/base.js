const tape = require('tape');
const fs = require('fs');
const mjpage = require('../lib/main.js').mjpage;

const input = fs.readFileSync(__dirname + '/test.html');

tape('Base check', function(t) {
    t.plan(1);
    mjpage(input, {
        format: ["TeX"],
        singleDollars: true
    }, {
        svg: true
    }, function(output) {
      t.ok(output, 'Output exists');
    });
});
