/**
 * @copyright: Copyright (c) 2024
 * @author: Paul Higgs
 * @file: decode-uwa.js
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

// see clause 9.2 of T/UWA 005-2.1

const DEBUGGING = false;

import { warning, error, normal } from './decode.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';
import { expressions } from './regular_expressions.js';

export function decodeUWA(val) {

	if (!expressions.CUVV.regex.test(val)) 
		return [error('Regex mismatch!'), error(`${expressions.CUVV.format}`), error(expressions.CUVV.description)];

	const parts = val.split('.');

	// the following tests should not fail as the format is checked with the regular expression
	if (parts.length != 2) return [error('invalid format')];

	const coding_params = { type: 'video', codec: parts[0] }, res = [];

	for (let i=0; i<parts[1].length; i++) {
		if (parts[1][i] == '1') {
			res.push(normal(`HDR Vivid version ${parts[1].length-i} is present`));
		}
	}
	if (res.length == 0)
		res.push(warning('No HDR Vivid versions present'));

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}


export function registerUWA(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler('cuvv', 'HDR Vivid', decodeUWA, outputHTML);
}