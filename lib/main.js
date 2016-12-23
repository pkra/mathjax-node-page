const jsdom = require('jsdom');
const serializeDocument = jsdom.serializeDocument;
const mathjax = require('mathjax-node');
const typeset = mathjax.typeset;
const tex = require('./tex.js').tex2jax;
const ascii = require('./ascii.js').ascii2jax;
const mathml = require('./mathml.js').mathml2jax;


exports.mjpage = function(htmlstring, configOptions, typesetOptions, callback) {

    // `config` extends options for mathjax-node's config method, cf https://github.com/mathjax/MathJax-node/wiki/Configuration-options#configoptions

    const config = {
        // mathjax-node-page specific
        format: ["MathML", "TeX", "AsciiMath"], // determines type of pre-processors to run
        tex: {}, // configuration options for tex pre-processor
        ascii: {}, // configuration options for ascii pre-processor
        singleDollars: false, // allow single-dollar delimiter for inline TeX
        jsdom: {
            FetchExternalResources: [],
            ProcessExternalResources: false,
            // NOTE virtualConsole: not the jsdom way but for configurability (cf. below)
            virtualConsole: true
        },
        //
        // standard mathjax-node options
        //
        displayMessages: false, // determines whether Message.Set() calls are logged
        displayErrors: true, // determines whether error messages are shown on the console
        undefinedCharError: false, // determines whether unknown characters are saved in the error array
        extensions: '', // a convenience option to add MathJax extensions
        fontURL: 'https://cdn.mathjax.org/mathjax/latest/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
        MathJax: {} // options MathJax configuration, see https://docs.mathjax.org
    }
    const mjstate = {};
    // defaults for mathjax-node's typeset method
    const typesetConfig = {
        ex: 6, // ex-size in pixels
        width: 100, // width of container (in ex) for linebreaking and tags
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
        speakText: false, // add spoken annotations to svg output?
        speakRuleset: "mathspeak", // set speech ruleset (default (chromevox rules), mathspeak)
        speakStyle: "default", // set speech style (mathspeak:  default, brief, sbrief)
        timeout: 10 * 1000, // 10 second timeout before restarting MathJax
    }


    //merge configurations

    const mergeConfig = function(conf, confDefaults) {
        for (index in conf) {
            confDefaults[index] = conf[index];
        }
    };

    mergeConfig(configOptions, config);
    mergeConfig(typesetOptions, typesetConfig);

    // Set jsdom console (cf. defaults for config.jsdom)
    if (config.jsdom.virtualConsole) {
      config.jsdom.virtualConsole = jsdom.createVirtualConsole().sendTo(console);
    }

    // set up DOM basics
    const doc = jsdom.jsdom(htmlstring, config.jsdom);
    const window = doc.defaultView;
    const document = window.document;


    // configure and pre-process
    if (config.format.indexOf('MathML') > -1) {
        window.mathml = mathml;
        window.mathml.config.doc = document;
        window.mathml.PreProcess();
    }
    if (config.format.indexOf('TeX') > -1) {
        if (config.MathJax.tex2jax) {
            mergeConfig(config.MathJax.tex2jax, tex.config);
        }
        window.tex = tex;
        window.tex.config.doc = document;
        if (config.singleDollars) {
            window.tex.config.inlineMath.push(['$', '$']);
            window.tex.config.processEscapes = true;
        }
        window.tex.PreProcess();
    }
    if (config.format.indexOf('AsciiMath') > -1) {
        if (config.MathJax.ascii2jax) {
            mergeConfig(config.MathJax.asciijax, tex.config);
        }
        window.ascii = ascii;
        window.ascii.config.doc = document;
        window.ascii.PreProcess();
    }

    // convert with mathjax-node
    const scripts = document.querySelectorAll('script[type^="math/"]');
    const process = function(index) {
        const script = scripts[index];
        if (script) {
            const format = script.getAttribute('type').slice(5);
            const conf = typesetConfig;
            conf.format = format;
            conf.math = script.text;
            typeset(conf, function(result) {
                if (result.errors) {
                    console.log('Error source: ' + script.outerHTML);
                    // throw result.errors;
                }
                if (result.html) {
                    script.outerHTML = result.html;
                }
                if (result.svg) {
                    script.outerHTML = result.svg;
                }
                if (result.mml) {
                    script.outerHTML = result.mml;
                }
                // recursion
                process(index + 1);
            });
        } else {
            if (index === 0) {
                // no math detected, return document
                const output = serializeDocument(document);
                window.close();
                callback(output);
            } else {
                // a dummy call to wait for mathjax-node to finish
                const conf = typesetConfig;
                conf.format = 'TeX';
                conf.math = '';
                typeset(conf, function(result) {
                    if (result.css) {
                        var styles = document.createElement('style');
                        styles.setAttribute('type', 'text/css');
                        styles.appendChild(document.createTextNode(result.css));
                        document.head.appendChild(styles);
                    }
                    if (typesetConfig.useGlobalCache) {
                        var globalSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        globalSVG.style.display = 'none';
                        // TODO `globalSVG.appendChild(document.importNode(state.defs,true))` throws error
                        // `globablSVG.appendChild(mjstate.defs)`` throws WrongDocumentError so above seems correct
                        globalSVG.innerHTML = mjstate.defs.outerHTML;
                        document.body.appendChild(globalSVG);
                    }
                    const output = serializeDocument(document);
                    window.close();
                    callback(output);
                })
            }
        }

    }
    process(0);
}
