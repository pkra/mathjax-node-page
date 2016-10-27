const jsdom = require('jsdom');
const mathjax = require('mathjax-node');
const typeset = mathjax.typeset;
const serializeDocument = require("jsdom").serializeDocument;
const tex = require('./tex.js').tex2jax;
const ascii = require('./ascii.js').ascii2jax;
const mathml = require('./mathml.js').mathml2jax;


exports.mjpage = function(htmlstring, configOptions, typesetOptions, callback) {

    // `config` extends options for mathjax-node's config method, cf https://github.com/mathjax/MathJax-node/wiki/Configuration-options#configoptions

    let config = {
        // mathjax-node-page specific
        format: ["MathML", "TeX", "AsciiMath"], // determines type of pre-processors to run TODO: and order
        tex: {}, // configuration options for tex pre-processor
        ascii: {}, // configuration options for ascii pre-processor
        singleDollars: true, // allow single-dollar delimiter for inline TeX?
        // standard mathjax-node
        displayMessages: false, // determines whether Message.Set() calls are logged
        displayErrors: true, // determines whether error messages are shown on the console
        undefinedCharError: false, // determines whether unknown characters are saved in the error array
        extensions: '', // a convenience option to add MathJax extensions
        fontURL: 'https://cdn.mathjax.org/mathjax/latest/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
        MathJax: {} // options MathJax configuration, see https://docs.mathjax.org
    }

    // defaults for mathjax-node's typeset method
    let typesetConfig = {
        ex: 6, // ex-size in pixels
        width: 100, // width of container (in ex) for linebreaking and tags
        useFontCache: true, // use <defs> and <use> in svg output?
        useGlobalCache: false, // use common <defs> for all equations?
        linebreaks: false, // do linebreaking?
        equationNumbers: "none", // or "AMS" or "all"
        math: "", // the math to typeset
        html: false, // generate HTML output?
        css: false, // generate CSS for HTML output?
        mml: false, // generate mml output?
        svg: false, // generate svg output?
        speakText: false, // add spoken annotations to svg output?
        speakRuleset: "mathspeak", // set speech ruleset (default (chromevox rules), mathspeak)
        speakStyle: "default", // set speech style (mathspeak:  default, brief, sbrief)
        timeout: 10 * 1000, // 10 second timeout before restarting MathJax
    }

    //merge configurations
    for (index in configOptions) {
        config[index] = configOptions[index];
    }
    for (index in typesetOptions) {
        typesetConfig[index] = typesetOptions[index];
    }

    // set up DOM basics
    let doc = jsdom.jsdom(htmlstring, {
        FetchExternalResources: [],
        ProcessExternalResources: false,
        virtualConsole: jsdom.createVirtualConsole().sendTo(console)
    });
    let window = doc.defaultView;
    let document = window.document;


    // configure
    if (config.format.indexOf('TeX') > -1) {
        // TODO DRY up
        window.tex = tex;
        window.tex.config.doc = document;
        //TODO merge preprocessor configurations
        // window.tex.config.inlineMath = [['$','$'], ['\\(','\\)']];
        window.tex.PreProcess();
    }
    if (config.format.indexOf('AsciiMath') > -1) {
        window.ascii = ascii;
        window.ascii.config.doc = document;
        window.ascii.PreProcess();
    }
    if (config.format.indexOf('MathML') > -1) {
        window.mathml = mathml;
        window.mathml.config.doc = document;
        window.mathml.PreProcess();
    }

    // convert with mathjax-node
    let scripts = document.querySelectorAll('script[type^="math/"]');
    let process = function(index) {
        let script = scripts[index];
        if (script) {
            let format = script.getAttribute('type').slice(5);
            let conf = typesetConfig;
            conf.format = format;
            conf.math = script.text;
            typeset(conf, function(data) {
                if (data.errors) {
                    console.log('Error source: ' + script.outerHTML);
                    // throw data.errors;
                }
                if (data.html) {
                    script.outerHTML = data.html;
                }
                if (data.svg) {
                    script.outerHTML = data.svg;
                }
                if (data.mml) {
                    script.outerHTML = data.mml;
                }
                // recursion
                process(index + 1);
            });
        } else {
            // TODO handle SVG cache, CSS
            // serialize
            let output = serializeDocument(document);
            // clean up
            window.close();
            callback(output);
        }

    }
    process(0);
}
