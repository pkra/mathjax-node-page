const tape = require('tape');
const mjpage = require('../lib/main.js').mjpage;

tape('Error handling should work', function(t) {
    t.plan(2);

    const input = `error: $$\\Menci$$, non-error: $$\\sum\\limits_{i=0}^na_i$$`,
          errorMessage = 'HERE BE ERROR MESSAGE';
    mjpage(input, {
        output: 'svg',
        errorHandler: (id, wrapperNode, sourceFormula, sourceFormat, errors) => {
            t.ok(
              sourceFormula === '\\Menci' && errors[0] === 'TeX parse error: Undefined control sequence \\Menci', 
              'Error handler called with correct error information.'
            );

            wrapperNode.innerHTML = errorMessage;
        }
    }, {}, function(output) {
        t.ok(output.indexOf(errorMessage) !== -1, 'Error message successfully inserted to wrapper node.');
    });
});
