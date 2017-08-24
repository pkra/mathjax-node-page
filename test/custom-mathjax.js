const tape = require('tape');
const fs = require('fs');
const mjpage = require('../lib/main.js');
const sinon = require('sinon');

const input = '\\[\\LaTeX\\]';

tape('User can pass custom mathjax-node', function(t) {
    t.plan(3);

    const mjnode = {
        config: sinon.spy(),
        start: sinon.spy(),
        typeset: sinon.stub().callsFake((conf, cb) => {
            let res = {};
            res.mml = res.html = res.svg = conf.math;
            setTimeout(() => cb(res), 0);
        })
    };

    mjpage.init(mjnode);

    mjpage.mjpage(input, {
        format: ["TeX"]
    }, {
        svg: true
    }, function(output) {
        t.ok(output.indexOf(input.slice(2,-2))!==-1, 'Output equals input with custom mjNode');
        t.ok(mjnode.config.calledOnce, 'config function called once');
        t.ok(mjnode.typeset.calledTwice, 'typeset function called twice (one dummy call in the end)');
        mjpage.init();  // reset for other tests
    });
});
