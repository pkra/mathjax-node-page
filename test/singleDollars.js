const tape = require('tape');
const mjpage = require('../lib/main.js').mjpage;

const typesetConfigDefault = {
    ex: 6, // ex-size in pixels
    width: 100, // width of container (in ex) for linebreaking and tags
    useFontCache: true, // use <defs> and <use> in svg output?
    useGlobalCache: false, // use common <defs> for all equations?
    state: {}, // track global state
    linebreaks: false, // do linebreaking?
    equationNumbers: "none", // or "AMS" or "all"
    math: "", // the math to typeset
    html: false, // generate HTML output?
    css: false, // generate CSS for HTML output?
    mml: false, // generate mml output?
    svg: false, // generate svg output?
    speakText: true, // add spoken annotations to svg output?
    speakRuleset: "mathspeak", // set speech ruleset (default (chromevox rules), mathspeak)
    speakStyle: "default", // set speech style (mathspeak:  default, brief, sbrief)
    timeout: 10 * 1000, // 10 second timeout before restarting MathJax
};

tape('Support singleDollars', function(t) {
    const input = '$\\LaTeX$';
    t.plan(4);
    mjpage(input, {
        format: ["TeX"],
        singleDollars: true
    }, {
        mml: true
    }, function(output) {
        t.ok(output.indexOf(input) === -1, 'When true, input removed')
        t.ok(output.indexOf('<math') > -1, 'When true, output present')
    });
    mjpage(input, {
        format: ["TeX"],
        singleDollars: false
    }, {
        mml: true
    }, function(output) {
        t.ok(output.indexOf(input) > -1, 'When false, input not removed')
        t.ok(output.indexOf('<math') === -1, 'When false, output not present')
    });
});
