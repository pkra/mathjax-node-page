const tape = require('tape');
const mjpage = require('../lib/main.js').mjpage;

tape('Support singleDollars', function(t) {
    const input = '$\\LaTeX$';
    t.plan(2);
    mjpage(input, {
        format: ["TeX"],
        singleDollars: true
    }, {
        mml: true
    }, function(output) {
        t.ok(output.indexOf(input) === -1, 'input has been removed')
        t.ok(output.indexOf('<math') > -1, 'output present')
    });
});
