#! /usr/bin/env node

/************************************************************************
 *  Copyright (c) 2016 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const mjpage = require('../lib/main.js').mjpage;
const fs = require('fs');
const jsdom = require('jsdom').jsdom;

const argv = require("yargs")
    .strict()
    .usage("Usage: mjpage [options] < input.html > output.html", {
        speech: {
            boolean: true,
            describe: "include speech text"
        },
        linebreaks: {
            boolean: true,
            describe: "perform automatic line-breaking"
        },
        dollars: {
            boolean: true,
            describe: "use single-dollar delimiters"
        },
        format: {
            default: "AsciiMath,TeX,MathML",
            describe: "input format(s) to look for"
        },
        noGlobalSVG: {
            boolean: true,
            describe: "In SVG output use globalCache"
        },
        font: {
            default: "TeX",
            describe: "web font to use in SVG output"
        },
        semantics: {
            boolean: true,
            describe: "for TeX or Asciimath source and MathML output, add input in <semantics> tag"
        },
        notexhints: {
            boolean: true,
            describe: "for TeX input and MathML output, don't add TeX-specific classes"
        },
        output: {
            default: "SVG",
            describe: "output format (SVG, CommonHTML, or MML)"
        },
        eqno: {
            default: "none",
            describe: "equation number style (none, AMS, or all)"
        },
        ex: {
            default: 6,
            describe: "ex-size in pixels"
        },
        width: {
            default: 100,
            describe: "width of equation container in ex (for line-breaking)"
        },
        extensions: {
            default: "",
            describe: "extra MathJax extensions e.g. 'Safe,TeX/noUndefined'"
        },
        fontURL: {
            default: "https://cdn.mathjax.org/mathjax/latest/fonts/HTML-CSS",
            describe: "the URL to use for web fonts"
        }
    })
    .argv;

if (argv.font === "STIX") argv.font = "STIX-Web";
argv.format = argv.format.split(/ *, */);
const mjglobal = {
    extensions: argv.extensions,
    fontURL: argv.fontURL,
    singleDollars: argv.dollars,
    jsdom: {
        FetchExternalResources: [],
        ProcessExternalResources: false,
        virtualConsole: false
    },
    MathJax: {
        SVG: {
            font: argv.font
        },
        menuSettings: {
            semantics: argv.semantics,
            texHints: !argv.notexhints
        }
    }
};
const mjlocal = {
    format: argv.format,
    svg: (argv.output === 'SVG'),
    useGlobalCache: !argv.noGlobalSVG,
    html: (argv.output === 'CommonHTML'),
    css: (argv.output === 'CommonHTML'),
    mml: (argv.output === 'MML'),
    equationNumbers: argv.eqno,
    speakText: argv.speech,
    // speakRuleset: argv.speechrules.replace(/^chromevox$/i, "default"),
    // speakStyle: argv.speechstyle,
    ex: argv.ex,
    width: argv.width,
    linebreaks: argv.linebreaks
}

//
//  Read the input file and collect the file contents
//  When done, process the HTML.
//
const html = [];
process.stdin.on("readable", function(block) {
    const chunk = process.stdin.read();
    if (chunk) html.push(chunk.toString('utf8'));
});
process.stdin.on("end", function() {
    mjpage(html.join(""), mjglobal, mjlocal, function(result) {
        process.stdout.write(result);
    });
});
