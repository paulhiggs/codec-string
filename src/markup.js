/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: markup.js
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

import { datatypeIs } from './utils.js';

export const BREAK = '<br>';
export const LINE = '<hr>';

export var err = (str) => `<span style="color:red">${str}</span>`;

export var warn = (str) => `<span style="color:orange">${str}</span>`;

export var dflt = (str) => `<span style="font-style:italic">${str}</span>`;

export var em = (str) => `<em>${str}</em>`;

export var bold = (str) => `<span style="font-weight:bold">${str}</span>`;
export var italic = (str) => `<span style="color:italic">${str}</span>`;

export var title = (str) => `<span style="font-style:italic">${str}</span>`;

export var unprocessed = (str) => `<span style="color:orange">${str}</span>`;

export var code = (str) => `<pre>${str}</pre>`;

export var cell = (str, colspan = 1, rowspan = 1) =>
	`<td${colspan != 1 ? ` colspan="${colspan}"` : ''}${rowspan != 1 ? ` rowspan="${rowspan}"` : ''}>${str}</td>`;

/**
 * convert characters in the string to HTML entities
 *
 * @param {string} str String that should be displayed in HTML
 * @returns {string} A string with ENTITY representations of < and >
 */
export var HTMLsafe = (str) =>
	datatypeIs(str, 'string')
		? str.replace(/[&<>"'\n-]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '\n': BREAK, '-': '&#8209;' }[m]))
		: str;
