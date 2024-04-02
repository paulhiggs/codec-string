/**
 * @copyright: Copyright (c) 2021-2024
 * @author: Paul Higgs
 * @file: decode-vp9.js
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

/*
https://tools.axinom.com/capabilities/media

VP9 in MP4, Profile 0 (8-bit, 4:2:0), 8-bit, 4:2:0 colocated with luma (0,0), Color Primaries: BT.709, Transfer Characteristics: BT.709, Matrix Coefficients: BT.709, Color Range: Legal (Studio Swing Representation)

video/mp4; codecs="vp09.00.20.08" | Level 2, up to 480x256@30 and 1800 kbit/s.
video/mp4; codecs="vp09.00.21.08" | Level 2.1, up to 640x384@30 and 3600 kbit/s.
video/mp4; codecs="vp09.00.30.08" | Level 3, up to 1080x512@30 and 7200 kbit/s.
video/mp4; codecs="vp09.00.31.08" | Level 3.1, up to 1280x768@30 and 12 mbit/s.
video/mp4; codecs="vp09.00.40.08" | Level 4, up to 2048x1088@30 and 18 mbit/s.
video/mp4; codecs="vp09.00.50.08" | Level 5, up to 4096x2176@30 and 60 mbit/s.
video/mp4; codecs="vp09.00.60.08" | Level 6, up to 8192x4352@30 and 180 mbit/s.


vp09.00.10.08
  --> VP9, Profile 0, level 1, bit depth 8 (later fields defaulted)
vp09.01.20.08.01
  --> VP9, Profile 1, level 2, bit depth 8, 4:2:0 chroma subsampling colocated with (0,0) luma, (later fields defaulted)
vp09.01.20.08.01.01.01.01.00    
  --> VP9, Profile 1, level 2, bit depth 8, 4:2:0 chroma subsampling colocated with (0,0) luma, REC709 color/transfer/matrix, 
           luma/chroma encoded in the "legal" range
vp09.02.10.10.01.09.16.09.01
  --> VP9, Profile 2, level 1, 10-bit YUV content, 4:2:0 colocated with luma (0,0) chroma subsampling, ITU-R BT.2020 primaries, 
           ST 2084 EOTF, ITU-R BT.2020 non-constant luminance color matrix, full-range chroma/luma encoding.

https://www.webmproject.org/vp9/mp4/


<sample entry 4CC>.<profile>.<level>.<bitDepth>.<chromaSubsampling>.<colourPrimaries>.<transferCharacteristics>.<matrixCoefficients>.<videoFullRangeFlag>

Mandatory Fields
sample entry 4CC, profile, level, and bitDepth are all mandatory fields. If any of these fields are empty, or not within their 
allowed range, the processing device SHALL treat it as an error.

Optional Fields
colourPrimaries, transferCharacteristics, matrixCoefficients, videoFullRangeFlag, and chromaSubsampling are OPTIONAL, 
mutually inclusive (all or none) fields. If not specified then the processing device MUST use the values listed 
in the table below as defaults when deciding if the device is able to decode and potentially render the video.
*/

const DEBUGGING = true;

import { error } from './decode.js';
import { err, BREAK, HTMLsafe, cell, bold, warn, dflt } from './markup.js';
import { dumpJSONHTML } from './formatters.js';

export function decodeVP9(val) {
	const VP9regex = /^(vp09)(\.\d\d){3}(\.\d{0,2}){0,5}$/;
	const VP9format =
		'<sample entry 4CC>.<profile>.<level>.<bitDepth>.<chromaSubsampling>.<colourPrimaries>.<transferCharacteristics>.<matrixCoefficients>.<videoFullRangeFlag>';
	if (!VP9regex.test(val)) return [error('Regex failure'), error(VP9format)];

	const PROFILE_0 = 0,
		PROFILE_1 = 1,
		PROFILE_2 = 2,
		PROFILE_3 = 3;
	const BITS8 = 8,
		BITS10 = 10,
		BITS12 = 12;
	const CHROMA420_vert = 0,
		CHROMA420_luma = 1,
		CHROMA422 = 2,
		CHROMA444 = 3,
		CHROMA440 = 100; /* unsure hot 4:4:0 is signalled */

	const fields = [
		{
			index: 1,
			name: 'profile',
			value: -1,
			default: true,
			parseFn: parseProfile,
		},
		{ index: 2, name: 'level', value: -1, default: true, parseFn: parseLevel },
		{
			index: 3,
			name: 'bitDepth',
			value: -1,
			default: true,
			parseFn: parseColourBits,
		},
		{
			index: 4,
			name: 'chromaSubsampling',
			value: CHROMA420_luma,
			default: true,
			parseFn: parseChroma,
		},
		{
			index: 5,
			name: 'colourPrimaries',
			value: 1,
			default: true,
			parseFn: parseColourPrimaries,
		},
		{
			index: 6,
			name: 'transferCharacteristics',
			value: 1,
			default: true,
			parseFn: parseTransferCharacteristics,
		},
		{
			index: 7,
			name: 'matrixCoefficients',
			value: 1,
			default: true,
			parseFn: parseMartixCoefficients,
		},
		{
			index: 8,
			name: 'videoFullRangeFlag',
			value: 0,
			default: true,
			parseFn: parseVideoFullRangeFlag,
		},
	];
	function ProfileValue(f) {
		return f.find((elem) => elem.index == 1).value;
	}
	function MatrixCoefficientsValue(f) {
		return f.find((elem) => elem.index == 7).value;
	}

	function parseProfile(args) {
		if (args.value < PROFILE_0 || args.value > PROFILE_3) return error(`invalid profile (${args.value})`);
		return { value: args.value, description: `Profile ${args.value}` };
	}
	function parseLevel(args) {
		let lev = null;
		switch (args.value) {
			case 10:
				lev = '1';
				break;
			case 20:
				lev = '2';
				break;
			case 21:
				lev = '2.1';
				break;
			case 30:
				lev = '3';
				break;
			case 31:
				lev = '3.1';
				break;
			case 40:
				lev = '4';
				break;
			case 41:
				lev = '4.1';
				break;
			case 50:
				lev = '5';
				break;
			case 51:
				lev = '5.1';
				break;
			case 52:
				lev = '5.2';
				break;
			case 60:
				lev = '6';
				break;
			case 61:
				lev = '6.1';
				break;
			case 62:
				lev = '6.2';
				break;
		}
		return lev ? { value: args.value, description: `Level ${lev}` } : error(`unknown Level (${args.value})`);
	}

	function parseColourBits(args) {
		const bitDepth = args.value;
		if (bitDepth != 8 && bitDepth != 10 && bitDepth != 12) return error(`invalid Colour Bit Depth (${args.value})`);

		const res = { value: args.value },
			profile = ProfileValue(fields);
		if (bitDepth == BITS8 && (profile == PROFILE_2 || profile == PROFILE_3)) res.warning = '8 bit only possible with Profile 0 or 1';
		else if ((bitDepth == BITS10 || bitDepth == BITS12) && (profile == PROFILE_0 || profile == PROFILE_1))
			res.warning = `${bitDepth} bit only possible with Profle 2 or 3`;
		return res;
	}

	function parseChroma(args) {
		const chroma = args.value;
		let sample = null;
		switch (chroma) {
			case CHROMA420_vert:
				sample = '4:2:0 vertical';
				break;
			case CHROMA420_luma:
				sample = '4:2:0 colocated with luma (0,0)';
				break;
			case CHROMA422:
				sample = '4:2:2';
				break;
			case CHROMA444:
				sample = '4:4:4';
				break;
		}
		const res = { value: chroma };
		if (sample) {
			const profile = ProfileValue(fields);
			const matrix = MatrixCoefficientsValue(fields);

			res.description = sample;
			let ev = null;
			if ((profile == PROFILE_0 || profile == PROFILE_2) && (chroma == CHROMA440 || chroma == CHROMA444 || chroma == CHROMA422))
				ev = 'Profile 0 and 2 must be 4:2:0';
			else if ((profile == PROFILE_1 || profile == PROFILE_3) && (chroma == CHROMA420_vert || chroma == CHROMA420_luma))
				ev = '4:2:0 chroma sampling is not permitted with Profile 1 and 3';
			else if (matrix == 0 && chroma != CHROMA444) ev = '4:4:4 chroma sampling is required matricCoefficients=0 (RGB)';

			if (ev) res.warning = `note! ${ev}`;
		} else if (chroma >= 4 && chroma <= 7) return { value: chroma, warning: 'Reserved' };
		else return error(`invalid value for chroma subsampling (${chroma})`);

		return res;
	}

	function parseColourPrimaries(args) {
		// colourPrimaries is an integer that is defined by the "Colour primaries" section of ISO/IEC 23001-8:2016.
		const primaries = args.value;
		const res = { value: primaries };
		switch (primaries) {
			case 1:
				res.description = 'ITU-R BT.709';
				break;
			case 9:
				res.description = 'ITU-R BT.2020 primaries';
				break;
			default:
				return error(`invalid value for colour primaries (${primaries})`);
		}
		return res;
	}

	function parseTransferCharacteristics(args) {
		// transferCharacteristics is an integer that is defined by the "Transfer characteristics" section of ISO/IEC 23001-8:2016.
		const transferC = args.value;
		const res = { value: transferC };
		switch (transferC) {
			case 1:
				res.description = 'ITU-R BT.709';
				break;
			case 16:
				res.description = 'ST 2084 EOTF';
				break;
			default:
				return error(`invalid value for transfer characteristics (${transferC})`);
		}
		return res;
	}

	function parseMartixCoefficients(args) {
		// matrixCoefficients is an integer that is defined by the "Matrix coefficients" section of ISO/IEC 23001-8:2016.
		const matrix = args.value;
		const res = { value: matrix };
		switch (matrix) {
			case 0:
				res.description = 'RGB';
				break;
			case 1:
				res.description = 'ITU-R BT.709';
				break;
			case 9:
				res.description = 'ITU-R BT.2020 non-constant luminance color matrix';
				break;
			default:
				return error(`invalid value formatrix coefficients (${matrix})`);
		}
		return res;
	}

	function parseVideoFullRangeFlag(args) {
		//  0=legal range, 1=full-range chroma/luma encoding
		const flag = args.value;
		const res = { value: flag };
		switch (flag) {
			case 0:
				res.description = 'legal range';
				break;
			case 1:
				res.description = 'full-range chroma/luma encoding';
				break;
			default:
				return error(`invalid value full range flag(${flag})`);
		}
		return res;
	}

	const parts = val.split('.'),
		res = [];
	for (let i = 1; i < parts.length; i++)
		if (parts[i] != '') {
			const t = fields.find((elem) => elem.index == i);
			if (t) {
				t.value = parseInt(parts[i]);
				t.default = false;
			}
		}

	fields.forEach((field) => {
		res.push({ name: field.name, value: field.parseFn ? field.parseFn(field) : field.value, is_default: field.default });
	});
	return res;
}

function vp9HTML(label, parsed) {
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
				res += cell(line.value?.warning ? warn(line.value.warning) : '');
			} else res += cell(JSON.stringify(line.value));
		}

		if (line?.is_default) res += cell(dflt('(default)'));
		res += '</tr>';
	});
	res += '</table>';
	if (DEBUGGING) res += dumpJSONHTML(parsed);
	return res;
}

export function registerVP9(addHandler) {
	addHandler('vp09', 'VP9', decodeVP9, vp9HTML);
}
