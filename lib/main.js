const jsdom = require('jsdom');
const serializeDocument = jsdom.serializeDocument;
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const tex = require('./tex.js').tex2jax;
const ascii = require('./ascii.js').ascii2jax;
const mathml = require('./mathml.js').mathml2jax;
// HACK isolate confingurations cf #22
const texconfig = JSON.stringify(tex.config);
const asciiconfig = JSON.stringify(ascii.config);

let mathjax;
let typeset;

function MjPage(MjNode) {
    mathjax = MjNode || require('mathjax-node');
    typeset = mathjax.typeset;

    this._outstandingHandlers = {};  // counter for outstanding async operations on files
    this._parsedFormulasCache = {};  // keeping state between callbacks
    this._started = false;
}
util.inherits(MjPage, EventEmitter);
MjPage.prototype.constructor = MjPage;

MjPage.prototype._outputJax = ['mml', 'html', 'svg'];  // output options in typesetConfig
MjPage.prototype._outputHandlers = {};  // custom handlers for saving conversion results to DOM

MjPage.prototype.mjpage = function(htmlstring, configOptions, typesetOptions, callback) {
    // `config` extends options for mathjax-node's config method, cf https://github.com/mathjax/MathJax-node/wiki/Configuration-options#configoptions

    const config = {
        // mathjax-node-page specific
        format: ["MathML", "TeX", "AsciiMath"], // determines type of pre-processors to run
        output: '', // global override for output option; 'svg', 'html' or 'mml'
        tex: {}, // configuration options for tex pre-processor
        ascii: {}, // configuration options for ascii pre-processor
        singleDollars: false, // allow single-dollar delimiter for inline TeX
        fragment: false,
        jsdom: {
            // NOTE these are not straight jsdom configuration options (cf. below)
            FetchExternalResources: false,
            ProcessExternalResources: false,
            virtualConsole: true
        },
        //
        // standard mathjax-node options
        //
        displayMessages: false, // determines whether Message.Set() calls are logged
        displayErrors: true, // determines whether error messages are shown on the console
        undefinedCharError: false, // determines whether unknown characters are saved in the error array
        extensions: '', // a convenience option to add MathJax extensions
        fontURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js/fonts/HTML-CSS', // for webfont urls in the CSS for HTML output
        MathJax: {} // options MathJax configuration, see https://docs.mathjax.org
    };
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
        speakText: true, // add spoken annotations to svg output?
        speakRuleset: "mathspeak", // set speech ruleset (default (chromevox rules), mathspeak)
        speakStyle: "default", // set speech style (mathspeak:  default, brief, sbrief)
        timeout: 10 * 1000, // 10 second timeout before restarting MathJax
    };


    //merge configurations into defaults

    const mergeConfig = function(conf, confDefaults) {
        for (let index in conf) {
            confDefaults[index] = conf[index];
        }
    };

    mergeConfig(configOptions, config);
    mergeConfig(typesetOptions, typesetConfig);

    // override output options with global option
    if (this._outputJax.indexOf(config.output) > -1) {
        for (let jax of this._outputJax) {
            typesetConfig[jax] = (jax === config.output);
        }
    }

    // Create jsdom options (cf. defaults for config.jsdom)
    const jsdomConfig = {
        features: {
            FetchExternalResources: config.jsdom.FetchExternalResources,
            ProcessExternalResources: config.jsdom.ProcessExternalResources
        },
        virtualConsole: config.jsdom.virtualConsole
    };
    // translate 'true' option
    // TODO deprecate in favor of explicit default
    if (config.jsdom.virtualConsole === true) {
        jsdomConfig.virtualConsole = jsdom.createVirtualConsole().sendTo(console);
    }

    // set up DOM basics
    const doc = jsdom.jsdom(htmlstring, jsdomConfig);
    const window = doc.defaultView;
    const document = window.document;

    //rewrite custom scripts types from core MathJax
    const rewriteScripts = function(oldType, newType) {
        const scripts = document.querySelectorAll('script[type="' + oldType + '"]');
        for (let script of scripts) script.setAttribute('type', newType);
    };
    rewriteScripts('math/tex', 'math/inline-TeX');
    rewriteScripts('math/tex; mode=display', 'math/TeX');
    rewriteScripts('math/asciimath', 'math/asciiMath');

    // configure mathjax-node
    mathjax.config(config);

    // configure and pre-process
    if (config.format.indexOf('MathML') > -1) {
        window.mathml = mathml;
        window.mathml.config.doc = document;
        window.mathml.PreProcess();
    }
    // HACK clone configuration cf #22
    tex.config = JSON.parse(texconfig);
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
    // HACK clone configuration cf #22
    ascii.config = JSON.parse(asciiconfig);
    if (config.format.indexOf('AsciiMath') > -1) {
        if (config.MathJax.ascii2jax) {
            mergeConfig(config.MathJax.ascii2jax, ascii.config);
        }
        window.ascii = ascii;
        window.ascii.config.doc = document;
        window.ascii.PreProcess();
    }

    const scripts = document.querySelectorAll(`
        script[type="math/TeX"],
        script[type="math/inline-TeX"],
        script[type="math/AsciiMath"],
        script[type="math/MathML"],
        script[type="math/MathML-block"]`
    );

    // prepare state for parallel execution
    let hash = Math.random();
    this._parsedFormulasCache[hash] = [];
    this._outstandingHandlers[hash] = 0;

    // convert with mathjax-node (parallel launch)
    let index = 0;
    let script;
    // Start and run mathjax-node
    if(!this._started) {
        mathjax.start();
        this._started = true;
    }
    while (script = scripts[index]) {
        const format = script.getAttribute('type').slice(5);
        const conf = typesetConfig;
        conf.format = format;
        if (format === 'MathML-block') conf.format = 'MathML';
        conf.math = script.text;
        conf.state.hash = hash;
        const wrapper = document.createElement('span');
        if (format === 'TeX' || format === 'MathML-block') wrapper.className = 'mjpage mjpage__block';
        else wrapper.className = 'mjpage';
        script.parentNode.replaceChild(wrapper, script);
        typeset(conf, (result, options) => {  // async call
            if (result.errors) {
                console.error(`Formula ${options.state.sourceFormula} contains the following errors:\n`, result.errors);
                this._outstandingHandlers[hash]--;
                return;
                // console.log('Error source: ' + script.outerHTML);
                // throw result.errors;
            }

            for (let prop of this._outputJax) {
                if(result[prop]) {
                    if(this._outputHandlers[prop]) {
                        // user defined custom output handler (e.g. for png output)
                        this._outputHandlers[prop].call(this, wrapper, result[prop]);
                    } else {
                        // default handling is writing result to wrapper contents (e.g. for html, mml, svg outputs)
                        wrapper.innerHTML = result[prop];
                    }
                }
            }

            this._parsedFormulasCache[hash].push(result);
            // Since this call is async, decrease the counter of async operations to make sure all formulas are processed
            this._outstandingHandlers[hash]--;

            if (this._outstandingHandlers[hash] === 0) {
                this.emit('ready:' + hash);
            }
        });

        this._outstandingHandlers[hash]++;
        index++;
    }

    // when all formulas are parsed, relies on ready event internally to invoke the cb
    this.once('ready:' + hash, () => {
        // a dummy call to wait for mathjax-node to finish
        const conf = typesetConfig;
        conf.format = 'TeX';
        if(!conf.math) conf.math = '';
        typeset(conf, (result) => {
            // NOTE cf https://github.com/mathjax/MathJax-node/issues/283
            if (index > 0) {
                if (typesetConfig.svg && !typesetConfig.png) result.css = `
                            .mjpage .MJX-monospace {
                            font-family: monospace
                            }

                            .mjpage .MJX-sans-serif {
                            font-family: sans-serif
                            }

                            .mjpage {
                            display: inline;
                            font-style: normal;
                            font-weight: normal;
                            line-height: normal;
                            font-size: 100%;
                            font-size-adjust: none;
                            text-indent: 0;
                            text-align: left;
                            text-transform: none;
                            letter-spacing: normal;
                            word-spacing: normal;
                            word-wrap: normal;
                            white-space: nowrap;
                            float: none;
                            direction: ltr;
                            max-width: none;
                            max-height: none;
                            min-width: 0;
                            min-height: 0;
                            border: 0;
                            padding: 0;
                            margin: 0
                            }

                            .mjpage * {
                            transition: none;
                            -webkit-transition: none;
                            -moz-transition: none;
                            -ms-transition: none;
                            -o-transition: none
                            }

                            .mjx-svg-href {
                            fill: blue;
                            stroke: blue
                            }

                            .MathJax_SVG_LineBox {
                            display: table!important
                            }

                            .MathJax_SVG_LineBox span {
                            display: table-cell!important;
                            width: 10000em!important;
                            min-width: 0;
                            max-width: none;
                            padding: 0;
                            border: 0;
                            margin: 0
                            }

                            .mjpage__block {
                            text-align: center;
                            margin: 1em 0em;
                            position: relative;
                            display: block!important;
                            text-indent: 0;
                            max-width: none;
                            max-height: none;
                            min-width: 0;
                            min-height: 0;
                            width: 100%
                            }`;
                if (result.css) {
                    // TODO make optional
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
            }

            // clear cache
            delete this._parsedFormulasCache[hash];
            delete this._outstandingHandlers[hash];
            this._started = false;
            let output = '';
            if (config.fragment) output = document.body.innerHTML;
            else output = serializeDocument(document);
            window.close();
            callback(output);
        });
    });

    // no formulas to parse, hence call ready event handler immediately
    if (index === 0) {
        this.emit('ready:' + hash);
    }
};

let mjpage;
exports.init = function(MjNode) {
    if(mjpage && mjpage._started) {
        console.error(`mjpage was already initialized and is currently running.`)
    }

    mjpage = new MjPage(MjNode);
};

exports.mjpage = function(htmlstring, configOptions, typesetOptions, callback) {
    // init on the first call
    if(!mjpage) {
        mjpage = new MjPage();
    }

    mjpage.mjpage(htmlstring, configOptions, typesetOptions, callback);
};

/**
 * Add new output option and, optionally, assign an output handler for writing result to a DOM node.
 * Can be used to customize DOM result for default outputs, i.e. "html", "svg", "mml".
 * @param output {string} - new output option for mathjax-node (e.g. "png" if you are using mathjax-node-svg2png)
 * @param [handler] {function} - function that takes wrapper DOM element and mjnode conversion result and
 * modifies the DOM element. For example, the following is valid handler: (wrapper, data) => wrapper.innerHTML = data.
 */
exports.addOutput = function (output, handler) {
    if(!this._outputJax.includes(output)) {
        this._outputJax.push(output);
    }

    if(handler && handler instanceof Function) {
        MjPage.prototype._outputHandlers[output] = handler;
    }
};

exports._outputJax = MjPage.prototype._outputJax;