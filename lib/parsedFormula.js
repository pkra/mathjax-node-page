/**
 * Created by Roman Spiridonov <romars@phystech.edu> on 8/24/2017.
 */
"use strict";

/**
 * @name ParsedFormula
 * @type Object
 * @proprety {string} output - formula format
 * @property {string} sourceFormula - the source formula (including delimeters)
 * @property {string} formula - the converted formula (without delimeters)
 * @property {number} startIndex - the index at which sourceFormula appears in the text
 * @property {number} endIndex - the index immediately after the sourceFormula in the text
 * @property {string} [css] - css string for HTML output
 */
function ParsedFormula(output) {
    this.node = null;
    this.output;

}