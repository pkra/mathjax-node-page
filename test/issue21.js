const tape = require('tape');
const mjpage = require('../lib/main.js').mjpage;
const jsdom = require('jsdom').jsdom;

tape('Math gets wrapping span with correct class', function(t) {
    t.plan(1);
    const input = '<math><mi>a</mi></math> <math><mi>b</mi></math>';
    const expected = 2;
    mjpage(input, {
        format: ['MathML']
    }, {
        svg: true
    }, function(output) {
      const document = jsdom(output).defaultView.document;
      const result = document.querySelectorAll('.mjpage').length;
      t.equal(result, expected, 'All math elements are processed');
    });
});
