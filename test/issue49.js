const tape = require('tape');
const fs = require('fs');
const mjpage = require('../lib/main.js');
const mjnode = require('mathjax-node-svg2png');
const sinon = require('sinon');

const input = '\\[x^2\\]';

tape('User can pass mathjax-node-svg2png (issue 49)', function(t) {
    t.plan(2);

    mjpage.init(mjnode);
    mjpage.addOutput('png', (wrapper, data) => {
        wrapper.innerHTML = `<img src="${data}">`;
    });

    mjpage.mjpage(input, {
        format: ["TeX"]
    }, {
        png: true
    }, function(output) {
        t.ok(output.indexOf('<img src="data:image/png;base64,') !== -1);
        t.ok(output.indexOf('.mjx-svg-href') === -1);
        mjpage.init();  // reset for other tests
    });
});
