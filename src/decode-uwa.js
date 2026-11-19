/**
 * @copyright: Copyright (c) 2024-2026
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
	const result = val.match(expressions.CUVV.regex_grouped);
	if (!result || !result.groups) return [error('Regex mismatch!'), error(expressions.CUVV.format), error(expressions.CUVV.description)];

	// HDR Vivid is HDR dynamic mapping information, so it is classified as a DVB video conformance point, not a video codec
	const coding_params = { type: 'dynamic_hdr', codec: result.groups.four_cc },
		res = [],
		version_bits = result.groups.version_bits;

	// T/UWA 005-2.1 clause 9.2: CUVA_version_map "specifies the HDR Vivid version numbers, and each bit represents one version.
	// The highest bit indicates the highest version number, and the lowest bit the lowest version number. For example, "1101"
	// means that the ES contains versions 4, 3, and 1." So the rightmost bit is version 1.
	for (let i = 0; i < version_bits.length; i++) {
		if (version_bits[i] == '1') res.push(normal(`HDR Vivid version ${version_bits.length - i} is present`));
	}

	if (res.length == 0) res.push(warning('No HDR Vivid versions present'));

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function registerUWA(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler('cuvv', 'HDR Vivid', decodeUWA, outputHTML);
}
