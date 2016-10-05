var jsdom = require('jsdom');
var mathjax = require('mathjax-node');
var typeset = mathjax.typeset;
var serializeDocument = require("jsdom").serializeDocument;
var tex = require('./lib/tex.js').tex2jax;
var ascii = require('./lib/ascii.js').ascii2jax;
var mathml = require('./lib/mathml.js').mathml2jax;


exports.mjpage = function(input, mjglobal, mjlocal, callback) {
    // set up DOM basics
    var doc = jsdom.jsdom(input, {
        FetchExternalResources: [],
        ProcessExternalResources: false,
        virtualConsole: jsdom.createVirtualConsole().sendTo(console)
    });
    var window = doc.defaultView;
    var document = window.document;

    // import pre-processors into jsdom's window
    // import tex into window
    window.tex = tex;
    window.ascii = ascii;
    window.mathml = mathml;

    // configure
    window.tex.config.doc = document;
    window.ascii.config.doc = document;
    window.mathml.config.doc = document;
    // window.tex.config.inlineMath = [['$','$'], ['\\(','\\)']];

    window.tex.PreProcess();
    window.ascii.PreProcess();
    window.mathml.PreProcess();

    // run MathJax
    var scripts = document.querySelectorAll('script[type^="math/"]');
    for (var i=0; i < scripts.length; i++){
      let index = i;
      let script = scripts[index];
      let format = script.getAttribute('type').slice(5);
      let conf = mjlocal;
      conf.format = format;
      conf.math = script.text;
      typeset(conf, function(data) {
        if (data.errors){
          console.log('Error source: ' + script.outerHTML);
          throw data.errors;
        }
        var output = '';
        if (data.html){
          script.outerHTML = data.html;
        }
        if (data.svg){
          script.outerHTML = data.svg;
        }
        if (data.mml){
          script.outerHTML = data.mml;
        }
        //  | data.svg | data.mml | data.math;
        if ( (index + 1) === scripts.length) {
          // serialize
          // var output = "<!DOCTYPE html>" + window.document.querySelector('html').outerHTML;
          var output = serializeDocument(document);

          // clean up
          window.close();
          callback(output);
        }
      });
    }

}
