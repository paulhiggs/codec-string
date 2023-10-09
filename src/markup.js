/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode.js
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

export const BREAK = '<br>';

export function err(str) {
	return `<span style="color:red">${str}</span>`;
}

export function warn(str) {
	return `<span style="color:orange">${str}</span>`;
}

export function dflt(str) {
	return `<span style="font-style:italic">${str}</span>`;
}

export function em(str) {
	return `<em>${str}</em>`;
}

export function bold(str) {
	return `<span style="font-weight:bold">${str}</span>`;
}

export function title(str) {
	return `<span style="font-style:italic">${str}</span>`;
}

export function unprocessed(str) {
	return `<span style="color:orange">${str}</span>`;
}

export function cell(str, colspan = 1, rowspan = 1) {
	return `<td${colspan != 1 ? ` colspan="${colspan}"` : ''}${rowspan != 1 ? ` rowspan="${rowspan}"` : ''}>${str}</td>`;
}

/**
 * return the type of the argument passed
 * @param {any} arg the argument whose type we are interested in
 * @param {string} requiredType  the desired tyoe
 * @returns {boolean or string} the type of the argument or a boolean if the type matches the requiredType
 */
function datatypeIs(arg, requiredType = null) {
	if (!arg)
		// ensure null is not identified as an object
		return undefined;
	if (Array.isArray(arg)) return requiredType ? requiredType == 'array' : 'array';
	const typ = typeof arg;
	return requiredType ? requiredType == typ : typ;
}

/**
 * convert characters in the string to HTML entities
 *
 * @param {string} str String that should be displayed in HTML
 * @returns {string} A string with ENTITY representations of < and >
 */
export var HTMLsafe = (str) =>
	datatypeIs(str, 'string')
		? str.replace(/[&<>"'-]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '-': '&#8209;' }[m]))
		: str;
