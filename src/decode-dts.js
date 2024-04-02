/**
 * @copyright: Copyright (c) 2024
 * @author: Paul Higgs
 * @file: decode-dts.js
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
const DEBUGGING = false;

import { error } from './decode.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';

export function decodeDTS(val) {
	if (val.length != 4) return [error('no codec argments should be provided for DTS Audio')];
	const res = [],
		dvb = DVBclassification({ type: 'audio', codec: 'DTS', level: ['dtsx', 'dtsy'].includes(val.toLowerCase()) ? 'UHD' : 'HD', mode: val.toLowerCase() });
	if (dvb.length != 0) res.push({ dvb_term: dvb });
	return res;
}

function outputHTML(label, messages) {
	return simpleHTML(label, messages, DEBUGGING);
}

export function registerDTS(addHandler) {
	// ETSI TS 103 285 table 10
	addHandler('dtsc', 'DTS-HD Core', decodeDTS, outputHTML); // ETSI TS 102 114 annex H
	addHandler('dtsh', 'DTS-HD (with legacy core)', decodeDTS, outputHTML); // ETSI TS 102 114 annex H
	addHandler('dtse', 'DTS-HD Low Bit Rate', decodeDTS, outputHTML); // ETSI TS 102 114 annex H
	addHandler('dtsl', 'DTS-HD (lossless, without legacy core)', decodeDTS, outputHTML); // ETSI TS 102 114 annex H
	addHandler('dtsx', 'DTS UHD (Profile 2)', decodeDTS, outputHTML); // ETSI TS 103 491 annex E
	addHandler('dtsy', 'DTS UHD (Profile 3)', decodeDTS, outputHTML); // ETSI TS 103 491 annex E
}
