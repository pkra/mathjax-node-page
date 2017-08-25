/**
 * Created by Roman Spiridonov <romars@phystech.edu> on 8/25/2017.
 */
const tape = require('tape');
const fs = require('fs');
const mjpage = require('../lib/main.js').mjpage;

const input = fs.readFileSync('./test/data/test.html', {encoding: 'utf-8'});

tape('Big acceptance test', function(t) {
    t.plan(3);
    mjpage(input, {
        format: ["MathML", "TeX", "AsciiMath"],
        singleDollars: true,
        output: "svg"
    }, {}, function(output) {
        let expected = fs.readFileSync('./test/data/expected/test-svg.html', {encoding: 'utf-8'});
        t.equal(output, expected, 'Result for svg output is as expected');
    });

    mjpage(input, {
        format: ["MathML", "TeX", "AsciiMath"],
        singleDollars: true,
        output: "html"
    }, {}, function(output) {
        let expected = fs.readFileSync('./test/data/expected/test-html.html', {encoding: 'utf-8'});
        t.equal(output, expected, 'Result for html output is as expected');
    });

    mjpage(input, {
        format: ["MathML", "TeX", "AsciiMath"],
        singleDollars: true,
        output: "mml"
    }, {}, function(output) {
        let expected = fs.readFileSync('./test/data/expected/test-mml.html', {encoding: 'utf-8'});
        t.equal(output, expected, 'Result for mml output is as expected');
    });
});
