const tape = require('tape');
const { mjpage, JSDOM } = require('../lib/main.js');

const input = '<span>\\mathrm{Menci}</span><script type="math/tex; mode=display">\\LaTeX</script>';

tape('Passing input and result by jsdom object (issue 62)', function(t) {
    t.plan(2);

    const jsdom = new JSDOM(), document = jsdom.window.document;
    document.body.innerHTML = input;
    mjpage(jsdom, {
        output: 'svg'
    }, {}, function(output) {
      t.ok(output === jsdom, 'Output exists, and IS the input jsdom object');

      mjpage(input, {
          output: 'svg'
      }, {}, function(output) {
          t.ok(output === document.documentElement.outerHTML,
               'JSDOM and plain HTML input give the same output document');
      })
    });
});
