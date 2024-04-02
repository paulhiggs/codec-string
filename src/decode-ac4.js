/**
 * @copyright: Copyright (c) 2021-2024
 * @author: Paul Higgs
 * @file: decode-ac4.js
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

/**
 * ETSI TS 103-190-2 annex E.13 - https://www.etsi.org/deliver/etsi_ts/103100_103199/10319002/01.02.01_60/ts_10319002v010201p.pdf
 *
 * https://media.developer.dolby.com/AC4/AC4_DASH_for_BROADCAST_SPEC/index.html#help_files/topics/c_mpd_codec.html
 *
 **/
const DEBUGGING = false;

import { hexDigits } from './utils.js';
import { normal, error, warning } from './decode.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';

const AC4format = 'ac-4.<bitstream_version>.<presentation_version>.<mdcompat>';

// eslint-disable-next-line no-unused-vars
export function decodeEAC3(val) {
	if (val.toLowerCase() != 'ec-3') return [error('no additional parameters for Enhanced AC-3')];
	const res = [];
	const dvb = DVBclassification({ type: 'audio', codec: 'AC3', mode: 'E-AC3' });
	if (dvb.length != 0) res.push({ dvb_term: dvb });
	return res;
}

const decodeMDcompat = (mdcompat, pres_version) => {
	let res = '';
	switch (pres_version) {
		case 0:
			// clause 4.3.3.3.8 of ETSI TS 103 190-1 v1.3.1
			res = 'maximum channels: ';
			switch (mdcompat) {
				case 0:
					res += '2';
					break;
				case 1:
					res += '6';
					break;
				case 2:
					res += '9';
					break;
				case 3:
					res += '11';
					break;
				case 4:
					res += '13';
					break;
				case 5:
				case 6:
					return warning(`${res} Reserved`);
				case 7:
					res += 'Unrestricted';
					break;
				default:
					return error(`${res} invalid value (${mdcompat}).`);
			}
			break;
		case 1:
			// table 77 of ETSI TS 103 190-2 v1.2.1
			res = 'maximum tracks: ';
			switch (mdcompat) {
				case 0:
					res += '2';
					break;
				case 1:
					res += '6';
					break;
				case 2:
					res += '9';
					break;
				case 3:
					res += '11';
					break;
				case 4:
				case 5:
				case 6:
					return warning(`${res} Reserved`);
				case 7:
					res += 'Unrestricted';
					break;
				default:
					return error(`${res} invalid value (${mdcompat}).`);
			}
			break;
		default:
			return warning(`unsupported presentation version (${pres_version})`);
	}
	return normal(res);
};

export function decodeAC4(val) {
	const parts = val.split('.');

	if (parts.length != 4) return [error(`AC-4 format is "${AC4format}"`)];
	if (!hexDigits(parts[1]) || !hexDigits(parts[2]) || !hexDigits(parts[3])) return [error('parameters contain non-hex digits')];

	const coding_params = { type: 'audio', codec: parts[0] },
		bs_version = parseInt(parts[1], 16),
		pres_version = parseInt(parts[2], 16),
		mdcompat = parseInt(parts[3], 16),
		res = [];

	res.push(normal(`bitstream_version: ${bs_version}`));
	res.push(normal(`presentation_version: ${pres_version}`));
	res.push(decodeMDcompat(mdcompat, pres_version));

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

function outputHTML(label, messages) {
	return simpleHTML(label, messages, DEBUGGING);
}

export function registerAC4(addHandler) {
	// ETSI TS 103 285 table 8
	addHandler('ec-3', 'Enhanced AC-3', decodeEAC3, outputHTML);
	addHandler('ac-4', 'Digital Audio Compression (AC-4)', decodeAC4, outputHTML);
}
