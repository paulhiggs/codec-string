/**
 * @copyright: Copyright (c) 2021-2025
 * @author: Paul Higgs
 * @file: decode-aom.js
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

import { sscanf } from './sscanf-func.js';
import { normal, error, warning } from './decode.js';
import { simpleHTML } from './formatters.js';
import { expressions } from './regular_expressions.js';

import { decodeMPEG4audio } from './decode-mpeg.js';

export function decodeAV1(val) {
	// defined in https://aomediacodec.github.io/av1-isobmff/#codecsparam
	/* 
        <sample entry 4CC>.<profile>.<level><tier>.<bitDepth>.<monochrome>.<chromaSubsampling>.
        <colorPrimaries>.<transferCharacteristics>.<matrixCoefficients>.<videoFullRangeFlag>
  */
	if (!expressions.AV1.regex.test(val))
		return [error('Regex mismatch!'), error(expressions.AV1.format), error(expressions.AV1.description)];

	const parts = val.split('.');
	// this checks should not fail as the number of parts and the format are checked in the regupar expression
	if (parts.length < 4) return [error(`invalid format "${expressions.AV1.format}"`)];

	const res = [];

	switch (parts[1]) {
		case '0':
			res.push(normal('Main Profile'));
			break;
		case '1':
			res.push(normal('High Profile'));
			break;
		case '2':
			res.push(normal('Professional Profile'));
			break;
		default:
			res.push(error(`unknown profile (${parts[1]})`));
	}

	const levelAndTier = sscanf(parts[2], '%d%c');
	let lev = '';
	switch (levelAndTier[0]) {
		case 0:
			lev = '2.0';
			break;
		case 1:
			lev = '2.1';
			break;
		case 2:
			lev = '2.2';
			break;
		case 3:
			lev = '2.3';
			break;
		case 4:
			lev = '3.0';
			break;
		case 5:
			lev = '3.1';
			break;
		case 6:
			lev = '3.2';
			break;
		case 7:
			lev = '3.3';
			break;
		case 8:
			lev = '4.0';
			break;
		case 9:
			lev = '4.1';
			break;
		case 10:
			lev = '4.2';
			break;
		case 11:
			lev = '4.3';
			break;
		case 12:
			lev = '5.0';
			break;
		case 13:
			lev = '5.1';
			break;
		case 14:
			lev = '5.2';
			break;
		case 15:
			lev = '5.3';
			break;
		case 16:
			lev = '6.0';
			break;
		case 17:
			lev = '6.1';
			break;
		case 18:
			lev = '6.2';
			break;
		case 19:
			lev = '6.3';
			break;
		case 20:
			lev = '7.0';
			break;
		case 21:
			lev = '7.1';
			break;
		case 22:
			lev = '7.2';
			break;
		case 23:
			lev = '7.3';
			break;
		case 24:
		case 25:
		case 26:
		case 27:
		case 28:
		case 29:
		case 30:
			res.push(warning(`reserved level ${levelAndTier[0]}`));
			break;
		case 31:
			lev = 'Max';
			break;
		default:
			res.push(error(`unknown (${levelAndTier[0]})`));
	}
	if (lev.length) res.push(normal(`Level ${lev}`));

	switch (levelAndTier[1]) {
		case 'M':
		case 'm':
			res.push(normal('Main tier'));
			break;
		case 'H':
		case 'h':
			res.push(normal('High tier'));
			break;
		default:
			res.push(error(`unknown tier (${levelAndTier[1]})`));
	}

	switch (parseInt(parts[3])) {
		case 8:
			res.push(normal('8 bit'));
			break;
		case 10:
			res.push(normal('10 bit'));
			break;
		case 12:
			res.push(normal('12 bit'));
			break;
		default:
			res.push(error(`unknown bit depth (${parts[3]})`));
	}

	if (parts.length > 4)
		switch (parts[4]) {
			case '0':
				res.push(normal('Contains Y, U and V (colour)'));
				break;
			case '1':
				res.push(normal('No U or V (monochrome)'));
				break;
			default:
				res.push(error(`unknown mono_chrome (${parts[4]})`));
		}
	else res.push({ default: '0 Colour' });

	if (parts.length > 5)
		if (parts[5].length != 3) res.push(error(`incorrect subsampling length ${parts[5]}`));
		else {
			switch (parts[5][0]) {
				case '0':
					break;
				case '1':
					break;
				default:
					res.push(error(`invalid value for subsampling_x (${parts[5][0]})`));
			}
			switch (parts[5][1]) {
				case '0':
					break;
				case '1':
					break;
				default:
					res.push(error(`invalid value for subsampling_y (${parts[5][1]})`));
			}
			switch (parts[5][2]) {
				case '0':
					res.push(normal('CSP_UNKNOWN'));
					break;
				case '1':
					res.push(normal('CSP_VERTICAL'));
					break;
				case '2':
					res.push(normal('CSP_COLOCATED'));
					break;
				case '3':
					res.push(warning('CSP_RESERVED'));
					break;
				default:
					res.push(error(`invalid value for subsampling_y (${parts[5][2]})`));
			}
			if (parts[5][0] != '1' || parts[5][1] != '1')
				if (parts[5][2] != '0') res.push(error('third digit must be 0 when first or second digit are not set to 1'));
		}
	else res.push({ default: '110 4:2:0' });

	if (parts.length > 6)
		switch (parseInt(parts[6])) {
			case 1:
				res.push(normal('CP_BT_709 - BT.709'));
				break;
			case 2:
				res.push(normal('CP_UNSPECIFIED - Unspecified colour primaries'));
				break;
			case 4:
				res.push(normal('CP_BT_470_M - BT.470 System M (historical)'));
				break;
			case 5:
				res.push(normal('CP_BT_470_B_G - BT.470 System B, G (historical)'));
				break;
			case 6:
				res.push(normal('CP_BT_601 - BT.601'));
				break;
			case 7:
				res.push(normal('CP_SMPTE_240 - SMPTE 240'));
				break;
			case 8:
				res.push(normal('CP_GENERIC_FILM - Generic film (color filters using illuminant C)'));
				break;
			case 9:
				res.push(normal('CP_BT_2020 - BT.2020, BT.2100'));
				break;
			case 10:
				res.push(normal('CP_XYZ - SMPTE 428 (CIE 1921 XYZ)'));
				break;
			case 11:
				res.push(normal('CP_SMPTE_431 - SMPTE RP 431-2'));
				break;
			case 12:
				res.push(normal('CP_SMPTE_432 - SMPTE EG 432-1'));
				break;
			case 22:
				res.push(normal('CP_EBU_3213 - EBU Tech. 3213-E'));
				break;
			default:
				res.push(error(`unknown value for color_primaries (${parts[6]})`));
		}
	else res.push({ default: '1 (ITU-R BT.709)' });

	if (parts.length > 7)
		switch (parseInt(parts[7])) {
			case 0:
				res.push(warning(`TC_RESERVED_0 - For future use`));
				break;
			case 1:
				res.push(normal('TC_BT_709 - BT.709'));
				break;
			case 2:
				res.push(normal('TC_UNSPECIFIED - Unspecified'));
				break;
			case 3:
				res.push(warning('TC_RESERVED_3 - For future use'));
				break;
			case 4:
				res.push(normal('TC_BT_470_M - BT.470 System M (historical)'));
				break;
			case 5:
				res.push(normal('TC_BT_470_B_G - BT.470 System B, G (historical)'));
				break;
			case 6:
				res.push(normal('TC_BT_601 - BT.601'));
				break;
			case 7:
				res.push(normal('TC_SMPTE_240 - SMPTE 240 M'));
				break;
			case 8:
				res.push(normal('TC_LINEAR - Linear'));
				break;
			case 9:
				res.push(normal('TC_LOG_100 - Logarithmic (100 : 1 range)'));
				break;
			case 10:
				res.push(normal('TC_LOG_100_SQRT10 - Logarithmic (100 * Sqrt(10) : 1 range)'));
				break;
			case 11:
				res.push(normal('TC_IEC_61966 - IEC 61966-2-4'));
				break;
			case 12:
				res.push(normal('TC_BT_1361 - BT.1361'));
				break;
			case 13:
				res.push(normal('TC_SRGB - sRGB or sYCC'));
				break;
			case 14:
				res.push(normal('TC_BT_2020_10_BIT - BT.2020 10-bit systems'));
				break;
			case 15:
				res.push(normal('TC_BT_2020_12_BIT - BT.2020 12-bit systems'));
				break;
			case 16:
				res.push(normal('TC_SMPTE_2084 - SMPTE ST 2084, ITU BT.2100 PQ'));
				break;
			case 17:
				res.push(normal('TC_SMPTE_428 - SMPTE ST 428'));
				break;
			case 18:
				res.push(normal('TC_HLG - BT.2100 HLG, ARIB STD-B67'));
				break;
			default:
				res.push(error(`unknown value for transfer_characteristics (${parts[7]})`));
		}
	else res.push({ default: '1 (ITU-R BT.709)' });

	if (parts.length > 8)
		switch (parseInt(parts[8])) {
			case 0:
				res.push(normal('MC_IDENTITY - Identity matrix'));
				break;
			case 1:
				res.push(normal('MC_BT_709 - BT.709'));
				break;
			case 2:
				res.push(normal('MC_UNSPECIFIED - Unspecified'));
				break;
			case 3:
				res.push(warning('MC_RESERVED_3 - For future use'));
				break;
			case 4:
				res.push(normal('MC_FCC - US FCC 73.628'));
				break;
			case 5:
				res.push(normal('MC_BT_470_B_G - BT.470 System B, G (historical)'));
				break;
			case 6:
				res.push(normal('MC_BT_601 - BT.601'));
				break;
			case 7:
				res.push(normal('MC_SMPTE_240 - SMPTE 240 M'));
				break;
			case 8:
				res.push(normal('MC_SMPTE_YCGCO - YCgCo'));
				break;
			case 9:
				res.push(normal('MC_BT_2020_NCL - BT.2020 non-constant luminance, BT.2100 YCbCr'));
				break;
			case 10:
				res.push(normal('MC_BT_2020_CL - BT.2020 constant luminance'));
				break;
			case 11:
				res.push(normal('MC_SMPTE_2085 - SMPTE ST 2085 YDzDx'));
				break;
			case 12:
				res.push(normal('MC_CHROMAT_NCL - Chromaticity-derived non-constant luminance'));
				break;
			case 13:
				res.push(normal('MC_CHROMAT_CL - Chromaticity-derived constant luminance'));
				break;
			case 14:
				res.push(normal('MC_ICTCP BT.2100 - ICtCp'));
				break;
			default:
				res.push(error(`unknown value for marrix_coefficients (${parts[8]})`));
		}
	else res.push({ default: '1 (ITU-R BT.709)' });

	const _dflt_videoFullRangeFlag = '0 (studio swing representation)';
	if (parts.length > 9) {
		switch (parts[9]) {
			case '0':
				res.push(normal(_dflt_videoFullRangeFlag));
				break;
			case '1':
				res.push(normal('1 (full swing representation)'));
				break;
			default:
				res.push(error(`unknown value for video_full_range (${parts[9]})`));
		}
	} else res.push({ default: _dflt_videoFullRangeFlag });
	return res;
}

export function decodeIAMF(val) {
	// defined in https://aomediacodec.github.io/iamf/v1.1.0.html

	if (!expressions.IAMF.regex.test(val))
		return [error('Regex mismatch!'), error(expressions.IAMF.format), error(expressions.IAMF.description)];

	const parts = val.split('.');
	if (parts.length < 4) return [error(`invalid format "${expressions.IAMF.format}"`)];

	const res = [];
	let other=[];
	const primary_profile = parseInt(parts[1]);
	const secondary_profile = parseInt(parts[2]);

	res.push((primary_profile >= 0 && primary_profile<= 255) ? normal(`Primary profile: ${primary_profile}`) : error("<primary_profile> must be in the range 0..255"));
	res.push((secondary_profile >= 0 && secondary_profile<= 255) ? normal(`Secondary profile: ${secondary_profile}`) : error("<secondary_profile> must be in the range 0..255"));

	switch (parts[3]) {
		case "Opus":
			res.push(normal("Codec: Opus"));
			break;
		case "mp4a": {
			res.push(normal("Codec: AAC-LC"));
			let i=3, mp4codec = parts[i];
			while (++i < parts.length)
				mp4codec += '.' + parts[i];
			other=decodeMPEG4audio(mp4codec);
			break;
		}
		case "flaC":
			res.push(normal("Codec: FLAC"));
			break;
		case "ipcm":
			res.push(normal("Codec: LPCM"));
			break;
	}
	return res.concat(other);
}


export function registerAOM(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);
	
	addHandler('av01', 'AV1', decodeAV1, outputHTML);
	addHandler('iamf', 'IAMF/Eclipsa', decodeIAMF, outputHTML);
}
