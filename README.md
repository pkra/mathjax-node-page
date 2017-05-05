# mathjax-node-page [![Build Status](https://travis-ci.org/pkra/mathjax-node-page.svg?branch=master)](https://travis-ci.org/pkra/mathjax-node-page)

[![Greenkeeper badge](https://badges.greenkeeper.io/pkra/mathjax-node-page.svg)](https://greenkeeper.io/)

This Node.js module builds on [mathjax-node](https://github.com/mathjax/mathjax-node) and provides processing of larger content fragments

## installation

Use

```
npm install mathjax-node-page
```

to install mathjax-node-page and its dependencies.

## Usage

mathjax-node-page exports `mjpage` which expects four parameters:

```javascript
mjpage(input, mjpageConfig, mjnodeConfig, callback)
```

Where `input` is a string with HTML, `pageConfig` specifies page-wide options, and `mjnodeConfig` expects mathjax-node configuration options.

The defaults for `pageConfig` are

```javascript
{
    format: ["MathML", "TeX", "AsciiMath"], // determines type of pre-processors to run
    output: '', // global override for output option; 'svg', 'html' or 'mml'
    tex: {}, // configuration options for tex pre-processor, cf. lib/tex.js
    ascii: {}, // configuration options for ascii pre-processor, cf. lib/ascii.js
    singleDollars: false, // allow single-dollar delimiter for inline TeX
    fragment: false,
    jsdom: {... }, // jsdom-related options
    displayMessages: false, // determines whether Message.Set() calls are logged
    displayErrors: true, // determines whether error messages are shown on the console
    undefinedCharError: false, // determines whether unknown characters are saved in the error array
    extensions: '', // a convenience option to add MathJax extensions
    fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
    MathJax: {} // options MathJax configuration, see https://docs.mathjax.org
}
```
and where `mjnodeConfig` represents mathjax-node configuration options, the defaults are.

```javascript
{
  ex: 6, // ex-size in pixels
  width: 100, // width of math container (in ex) for linebreaking and tags
  useFontCache: true, // use <defs> and <use> in svg output?
  useGlobalCache: false, // use common <defs> for all equations?
  state: mjstate, // track global state
  linebreaks: false, // do linebreaking?
  equationNumbers: "none", // or "AMS" or "all"
  math: "", // the math to typeset
  html: false, // generate HTML output?
  css: false, // generate CSS for HTML output?
  mml: false, // generate mml output?
  svg: false, // generate svg output?
  speakText: true, // add spoken annotations to output?
  timeout: 10 * 1000, // 10 second timeout before restarting MathJax
}
```

## CLI

mathjax-node-page installs a CLI tool. Run `mjpage` to print usage instructions.

### Example

```javascript
const mjpage = require('../lib/main.js').mjpage;
const fs = require('fs');
const input = fs.readFileSync('input.html');

mjpage(input, {format: ["TeX"]}, {svg: true}, function(output) {
    console.log(output); // resulting HTML string
});
```
