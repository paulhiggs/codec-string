/**
 * @copyright: Copyright (c) 2024
 * @author: Paul Higgs
 * @file: formatters.js
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

import { err, BREAK, LINE, code, bold, warn, HTMLsafe, dflt, italic, cell, space } from './markup.js';

export function simpleHTML(label, parsed, debugging = false) {
	if (this?.error) return err(this.error) + BREAK;
	let res = '';
	if (label) res += bold(HTMLsafe(label)) + BREAK;
	parsed?.forEach((line) => {
		if (line?.decode) res += HTMLsafe(line.decode) + BREAK;
		else if (line?.error) res += err(HTMLsafe(line.error)) + BREAK;
		else if (line?.warning) res += warn(HTMLsafe(line.warning)) + BREAK;
		else if (line?.dvb_term) res += BREAK + bold('DVB term: ') + HTMLsafe(line.dvb_term) + BREAK;
		else if (line?.default) res += dflt(HTMLsafe(`default value: ${line.default}`)) + BREAK;
		else if (line?.informative) res += space(2) + italic(HTMLsafe(line.informative)) + BREAK;
	});
	return res + (debugging ? dumpJSONHTML(parsed) : '');
}

export function tabularHTML(label, parsed) {
	if (this?.error) return err(this.error) + BREAK;
	let res = '';
	if (label) res += bold(HTMLsafe(label)) + BREAK;

	res += '<table>';
	parsed?.forEach((line) => {
		res += '<tr>' + cell(line?.name ? line.name : '');
		if (line?.error) res += cell(err(HTMLsafe(line.error)));

		if (line?.value) {
			if (line.value?.error) res += cell(err(line.value.error));
			else if (Object.prototype.hasOwnProperty.call(line.value, 'value')) {
				res += cell(`${line.value.value} ${line.value?.description ? ` ${line.value.description}` : ''}`);
				if (line.value?.warning) res += cell(warn(line.value.warning));
			} else res += cell(JSON.stringify(line.value));
		}

		if (line?.is_default) res += cell(dflt('(default)'));
		res += '</tr>';
	});
	res += '</table>';
	return res;
}

export var dumpJSONHTML = (parsed, lineFirst = true) => (lineFirst ? LINE : '') + code(HTMLsafe(JSON.stringify(parsed, null, 2)));

export function jsonHTML(label, parsed) {
	let res = '';
	if (label) res += bold(HTMLsafe(label)) + BREAK;
	res += JSON.stringify(parsed);
	return res;
}
