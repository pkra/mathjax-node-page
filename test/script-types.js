const tape = require('tape');
const mjpage = require('../lib/main.js').mjpage;
const jsdom = require('jsdom').jsdom;

tape('Custom script types are processed correctly', function(t) {
    t.plan(3);
    const inlineInput = '<script type="math/tex"> e^{i\\pi} = -1</script>';
    mjpage(inlineInput, {
        format: ['TeX']
    }, {
        svg: true
    }, function(output) {
			const window = jsdom(output).defaultView
			const style = window.getComputedStyle(window.document.querySelector('.mjpage'))
      t.equal(style.textAlign, "left", '"math/tex" is left aligned');
    });

    const displayInput = '<script type="math/tex; mode=display"> e^{i\\pi} = -1</script>';
    mjpage(displayInput, {
        format: ['TeX']
    }, {
        svg: true
    }, function(output) {
			const window = jsdom(output).defaultView
			const style = window.getComputedStyle(window.document.querySelector('.mjpage__block'))
      t.equal(style.textAlign, "center", '"math/tex; mode=display" is center aligned');
    });

    const crazyCaseInput = '<script type="math/Tex   ;  modei  = display"> e^{i\\pi} = -1</script>';
    mjpage(crazyCaseInput, {
        format: ['TeX']
    }, {
        svg: true
    }, function(output) {
			const window = jsdom(output).defaultView
			const style = window.getComputedStyle(window.document.querySelector('.mjpage__block'))
      t.equal(style.textAlign, "center", 'Case and space insensitivity');
    });

});
