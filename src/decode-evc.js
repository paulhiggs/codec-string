/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-evc.js
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

// see annex E.9 of  ISO/IEC 14496-15:2019 Amd.2 "Carriage of VVC and EVC in ISOBMFF" (w19454)
// and ISO/IEC 23091-2 (MDS19669_WG05_N00011)

const debugging = false;

import { bitSet32 } from './bits.js';
import { error, warning, title, normal } from './decode.js';
import { jsonHTML } from './formatters.js';
import { bold, BREAK, LINE, HTMLsafe, err, warn, cell, dflt } from './markup.js';
import { datatypeIs } from './utils.js';

// see clause 8.1 of ISO/IEC 23091-2
function ISOIEC23091_2_ColourPrimaries(value) {
	if (value > 255) return [error(`invalid value (${value})`)];
	switch (value) {
		case 1:
			return [
				'Rec. ITU-R BT.709-6',
				'Rec. ITU-R BT.1361-0 conventional colour gamut system and extended colour gamut system (historical)',
				'IEC 61966-2-1 sRGB or sYCC',
				'IEC 61966-2-4',
				'Society of Motion Picture and Television Engineers RP 177 (1993) Annex B',
			];
		case 2:
			return [title('Unspecified'), 'Image characteristics are unknown or are determined by the application'];
		case 4:
			return [
				'Rec. ITU-R BT.470-6 System M (historical)',
				'United States National Television System Committee 1953 Recommendation for transmission standards for colour television',
				'United States Federal Communications Commission Title 47 Code of Federal Regulations (2003) 73.682 (a) (20)',
			];
		case 5:
			return [
				'Rec. ITU-R BT.470-6 System B, G (historical)',
				'Rec. ITU-R BT.601-7 625',
				'Rec. ITU-R BT.1358-0 625 (historical)',
				'Rec. ITU-R BT.1700-0 625 PAL and 625 SECAM',
			];
		case 6:
			return [
				'Rec. ITU-R BT.601-7 525',
				'Rec. ITU-R BT.1358-1 525 or 625 (historical)',
				'Rec. ITU-R BT.1700-0 NTSC',
				'Society of Motion Picture and Television Engineers ST 170 (2004)',
			];
		case 7:
			return ['Society of Motion Picture and Television Engineers ST 240 (1999)'];
		case 8:
			return ['Generic film (colour filters using Illuminant C)'];
		case 9:
			return ['Rec. ITU-R BT.2020-2', 'Rec. ITU-R BT.2100-2'];
		case 10:
			return ['Society of Motion Picture and Television Engineers ST 428-1 (2019)', '(CIE 1931 XYZ as in ISO 11664 1)'];
		case 11:
			return ['Society of Motion Picture and Television Engineers RP 431-2 (2011)'];
		case 12:
			return ['Society of Motion Picture and Television Engineers EG 432-1 (2010)'];
		case 22:
			return ['No corresponding industry specification identified'];
	}
	return [warning('Reserved -- For future use by ITU-T | ISO/IEC')];
}

// see clause 8.2 of ISO/IEC 23091-2
function ISOIEC23091_2_TransferCharacteristics(value) {
	if (value > 255) return [error(`invalid value (${value})`)];
	switch (value) {
		case 1:
			return ['Rec. ITU-R BT.709-6', 'Rec. ITU-R BT.1361-0 conventional colour gamut system (historical)'];
		case 2:
			return [title('Unspecified'), 'Image characteristics are unknown or are determined by the application.'];
		case 4:
			return [
				title('Assumed display gamma 2.2'),
				'Rec. ITU-R BT.470-6 System M (historical)',
				'United States National Television System Committee 1953 Recommendation for transmission standards for colour television',
				'United States Federal Communications Commission Title 47 Code of Federal Regulations (2003) 73.682 (a) (20)',
				'Rec. ITU-R BT.1700-0 625 PAL and 625 SECAM',
			];
		case 5:
			return [title('Assumed display gamma 2.8'), 'Rec. ITU-R BT.470-6 System B, G (historical)'];
		case 6:
			return [
				'Rec. ITU-R BT.601-7 525 or 625',
				'Rec. ITU-R BT.1358-1 525 or 625 (historical)',
				'Rec. ITU-R BT.1700-0 NTSC',
				'Society of Motion Picture and Television Engineers ST 170 (2004)',
			];
		case 7:
			return ['Society of Motion Picture and Television Engineers ST 240 (1999)'];
		case 8:
			return ['Linear transfer characteristics'];
		case 9:
			return ['Logarithmic transfer characteristic (100:1 range)'];
		case 10:
			return ['Logarithmic transfer characteristic (100 * Sqrt( 10 ) : 1 range)'];
		case 11:
			return ['IEC 61966-2-4'];
		case 12:
			return ['Rec. ITU-R BT.1361-0 extended colour gamut system (historical)'];
		case 13:
			return ['IEC 61966-2-1 sRGB (with MatrixCoefficients equal to 0)', 'IEC 61966-2-1 sYCC (with MatrixCoefficients equal to 5)'];
		case 14:
			return ['Rec. ITU-R BT.2020-2'];
		case 15:
			return ['Rec. ITU-R BT.2020-2'];
		case 16:
			return [
				'Society of Motion Picture and Television Engineers ST 2084 (2014) for 10, 12, 14, and 16-bit systems',
				'Rec. ITU-R BT.2100-2 perceptual quantization (PQ) system',
			];
		case 17:
			return ['Society of Motion Picture and Television Engineers ST 428-1 (2019)'];
		case 18:
			return ['Association of Radio Industries and Businesses (ARIB) STD-B67 (2018)', 'Rec. ITU-R BT.2100-2 hybrid log-gamma (HLG) system'];
	}
	return [warning('Reserved -- For future use by ITU-T | ISO/IEC')];
}

// see clause 8.3 of ISO/IEC 23091-2
function ISOIEC23091_2_MatrixCoefficients(value) {
	if (value > 255) return [error(`invalid value (${value})`)];
	switch (value) {
		case 0:
			return [
				title('Identity'),
				'The identity matrix.',
				'Typically used for GBR (often referred to as RGB); however, may also be used for YZX (often referred to as XYZ);',
				'IEC 61966-2-1 sRGB',
				'Society of Motion Picture and Television Engineers ST 428-1 (2019)',
			];
		case 1:
			return [
				'Rec. ITU-R BT.709-6',
				'Rec. ITU-R BT.1361-0 conventional colour gamut system and extended colour gamut system (historical)',
				'IEC 61966-2-4 xvYCC<sub>709</sub>',
				'Society of Motion Picture and Television Engineers RP 177 (1993) Annex B',
			];
		case 2:
			return [title('Unspecified'), 'Image characteristics are unknown or are determined by the application'];
		case 4:
			return ['United States Federal Communications Commission Title 47 Code of Federal Regulations (2003) 73.682 (a) (20)'];
		case 5:
			return [
				'Rec. ITU-R BT.470-6 System B, G (historical)',
				'Rec. ITU-R BT.601-7 625',
				'Rec. ITU-R BT.1358-0 625 (historical)',
				'Rec. ITU-R BT.1700-0 625 PAL and 625 SECAM',
				'IEC 61966-2-1 sYCC',
				'IEC 61966-2-4 xvYCC<sub>601</sub>',
			];
		case 6:
			return [
				'Rec. ITU-R BT.601-7 525',
				'Rec. ITU-R BT.1358-1 525 or 625 (historical)',
				'Rec. ITU-R BT.1700-0 NTSC',
				'Society of Motion Picture and Television Engineers ST 170 (2004)',
			];
		case 7:
			return ['Society of Motion Picture and Television Engineers ST 240 (1999)'];
		case 8:
			return [title('YCgCo')];
		case 9:
			return ['Rec. ITU-R BT.2020-2 (non-constant luminance)', "Rec. ITU-R BT.2100-2 Y'CbCr"];
		case 10:
			return ['Rec. ITU-R BT.2020-2 (constant luminance)'];
		case 11:
			return ['Society of Motion Picture and Television Engineers ST 2085 (2015)'];
		case 12:
			return ['Chromaticity-derived non-constant luminance system'];
		case 13:
			return ['Chromaticity-derived constant luminance system'];
		case 14:
			return ['Rec. ITU-R BT.2100-2 IC<sub>T</sub>C<sub>P</sub>'];
	}
	return [warning('Reserved -- For future use by ITU-T | ISO/IEC')];
}

// see clause 8.4 of ISO/IEC 23091-2
function ISOIEC23091_2_VideoFramePackingType(value) {
	switch (value) {
		case 0:
			return 'Each component plane of the decoded frames contains a "checkerboard" based interleaving of corresponding planes of two constituent frames as illustrated in Figure 2';
		case 1:
			return 'Each component plane of the decoded frames contains a column-based interleaving of corresponding planes of two constituent frames as illustrated in Figure 3';
		case 2:
			return 'Each component plane of the decoded frames contains a row-based interleaving of corresponding planes of two constituent frames as illustrated in Figure 4';
		case 3:
			return 'Each component plane of the decoded frames contains a side-by-side packing arrangement of corresponding planes of two constituent frames as illustrated in Figure 5 and Figure 7';
		case 4:
			return 'Each component plane of the decoded frames contains top-bottom packing arrangement of corresponding planes of two constituent frames as illustrated in Figure 6';
		case 5:
			return 'The component planes of the decoded frames in output order form a temporal interleaving of alternating first and second constituent frames as illustrated in Figure 8';
		case 6:
			return 'The decoded frame constitutes a complete 2D frame without any frame packing (see NOTE 4).<BR>NOTE 4    VideoFramePackingType equal to 6 is used to signal the presence of 2D content (that is not frame packed) in 3D services that use a mix of 2D and 3D content.';
	}
	return warning('Reserved -- For future use by ITU-T | ISO/IEC');
}

// see clause 8.5 of ISO/IEC 23091-2
function ISOIEC23091_2_PackedContentInterpretationType(value) {
	if (value > 15) return [error(`invalid value (${value})`)];
	switch (value) {
		case 0:
			return ['Unspecified relationship between the frame packed constituent frames'];
		case 1:
			return [
				'Indicates that the two constituent frames form the left and right views of a stereo view scene, with frame 0 being associated with the left view and frame 1 being associated with the right view',
			];
		case 2:
			return [
				'Indicates that the two constituent frames form the right and left views of a stereo view scene, with frame 0 being associated with the right view and frame 1 being associated with the left view',
			];
	}
	return [warning('Reserved -- For future use by ITU-T | ISO/IEC')];
}

// see clause 8.6 of ISO/IEC 23091-2
function ISOIEC23091_2_SampleAspectRatio(value) {
	if (value > 255) return [error(`invalid value (${value})`)];
	switch (value) {
		case 0:
			return ['Unspecified'];
		case 1:
			return ['1:1'];
		case 2:
			return ['12:11'];
		case 3:
			return ['10:11'];
		case 4:
			return ['16:11'];
		case 5:
			return ['40:33'];
		case 6:
			return ['24:11'];
		case 7:
			return ['20:11'];
		case 8:
			return ['32:11'];
		case 9:
			return ['80:33'];
		case 10:
			return ['18:11'];
		case 11:
			return ['15:11'];
		case 12:
			return ['64:33'];
		case 13:
			return ['160:99'];
		case 14:
			return ['4:3'];
		case 15:
			return ['3:2'];
		case 16:
			return ['2:1'];
		case 255:
			return ['SarWidth : SarHeight'];
	}
	return [warning('Reserved -- For future use by ITU-T | ISO/IEC')];
}

export function decodeEVC(val) {
	const BASELINE_PROFILE = 0,
		MAIN_PROFILE = 1,
		BASELINE_STILL_PROFILE = 2,
		MAIN_STILL_PROFILE = 3;
	const ProfileNames = ['Baseline profile', 'Main profile', 'Baseline Still Picture profile', 'Main Still Picture profile'];

	function showbit(v) {
		return v ? '1' : '0';
	}

	// see annex E.9 of ISO/IEC 14496-15
	function printBitDepth(args) {
		const luma = Math.floor(args.value / 10),
			chroma = args.value % 10;
		return { value: args.value, description: `luma=${luma + 8}bit, chroma=${chroma + 8}bit` };
	}

	// see annex E.9 of ISO/IEC 14496-15
	function printChroma(args) {
		const J = Math.floor(args.value / 100),
			a = Math.floor((args.value - J * 100) / 10),
			b = args.value % 10;
		return { value: args.value, description: `${J}:${a}:${b}` };
	}

	function describe(value, infoFunction) {
		return { value: value, description: infoFunction(value) };
	}

	function printProfile(args) {
		// accprding to Annex A.3 of ISO/IEC 23094-1 (FDIS is w19229)
		let res = null;
		switch (args.value) {
			case BASELINE_PROFILE:
			case MAIN_PROFILE:
			case BASELINE_STILL_PROFILE:
			case MAIN_STILL_PROFILE:
				res = ProfileNames[args.value];
				break;
			default:
				res = error('invalid');
				break;
		}
		return { value: args.value, description: res };
	}

	function printLevel(args) {
		// accprding to Annex A.4 of ISO/IEC 23094-1 (FDIS is w19229)
		let res = null;
		switch (args.value) {
			case 10:
				res = 'Level 1';
				break;
			case 20:
				res = 'Level 2';
				break;
			case 21:
				res = 'Level 2.1';
				break;
			case 30:
				res = 'Level 3';
				break;
			case 31:
				res = 'Level 3.1';
				break;
			case 40:
				res = 'Level 4';
				break;
			case 41:
				res = 'Level 4.1';
				break;
			case 50:
				res = 'Level 5';
				break;
			case 51:
				res = 'Level 5.1';
				break;
			case 52:
				res = 'Level 5.2';
				break;
			case 60:
				res = 'Level 6';
				break;
			case 61:
				res = 'Level 6.1';
				break;
			case 62:
				res = 'Level 6.1';
				break;
			default:
				res = error('invalid');
				break;
		}
		return { value: args.value, description: res };
	}

	function printColourPrimaries(args) {
		return describe(args.value, ISOIEC23091_2_ColourPrimaries);
	}

	function printTransferCharacteristics(args) {
		return describe(args.value, ISOIEC23091_2_TransferCharacteristics);
	}

	function printMatrixCoefficients(args) {
		return describe(args.value, ISOIEC23091_2_MatrixCoefficients);
	}

	function printFramePackingType(args) {
		if (!args.value) return normal('no frame packing is used');
		const qsf = Math.floor(args.value / 10),
			vfpt = args.value % 10;
		return {
			value: args.value,
			description: [
				{ label: 'QuincunxSamplingFlag', value: qsf },
				{
					label: 'VideoFramePackingType',
					value: ISOIEC23091_2_VideoFramePackingType(vfpt),
				},
			],
		};
	}

	function printPackedContentInterpretationType(args) {
		if (!args.value) return normal('packed content is not used');
		return describe(args.value, ISOIEC23091_2_PackedContentInterpretationType);
	}

	function printSampleAspectRatio(args) {
		return describe(args.value, ISOIEC23091_2_SampleAspectRatio);
	}

	function evaluate(tool, highBit, lowBit, profile_idc) {
		if (profile_idc == BASELINE_PROFILE && highBit | lowBit) return ` --> must be 0 for ${ProfileNames[BASELINE_PROFILE]}`;
		return null;
	}

	function analyseToolset(toolset_idc_h, toolset_idc_l, profile_idc) {
		const res = [];
		toolset.forEach((t) => {
			res.push({
				tool: t.tool,
				description: `[h:${showbit(bitSet32(toolset_idc_h, t.bit))} l:${showbit(bitSet32(toolset_idc_l, t.bit))}]`,
				error: evaluate(t.tool, bitSet32(toolset_idc_h, t.bit), bitSet32(toolset_idc_l, t.bit), profile_idc),
			});
		});
		return res;
	}

	function printToolset(values) {
		const h = values.find((v) => v.key == KEY_TOOLSET_HIGH);
		const l = values.find((v) => v.key == KEY_TOOLSET_LOW);
		const p = values.find((v) => v.key == KEY_PROFILE);

		if (!h || !l || !p) return [error('cant decode toolset')];

		const res = [];
		res.push({ toolset: { key: h.key, label: h.label, value: h.value, description: analyseToolset(h.value, l.value, p.value), is_default: h.default } });
		res.push({ toolset: { key: l.key, label: l.label, value: l.value, description: null, is_default: l.default } });
		return res;
	}

	function SetKeyValue(values, key, value, expression, hexadecimal = false) {
		if (!expression.test(value)) return error(`invalid value for key=${key} (${value}) /${expression.source}/`);

		const t = values.find((elem) => elem.key == key);
		if (t) {
			if (!t.default) {
				return error(`key ${key} can only be provided once`);
			} else {
				t.value = parseInt(value, hexadecimal ? 16 : 10);
				t.default = false;
			}
		}
		return null;
	}

	const parts = val.split('.');

	const KEY_PROFILE = 'vprf',
		KEY_LEVEL = 'vlev',
		KEY_TOOLSET_HIGH = 'vtoh',
		KEY_TOOLSET_LOW = 'vtol';
	const KEY_BIT_DEPTH = 'vbit',
		KEY_CHROMA = 'vcss',
		KEY_PRIMARIES = 'vcpr';
	const KEY_XFER_CHAR = 'vtrc',
		KEY_MATRIX_COEFF = 'vmac',
		KEY_FULL_RANGE = 'vfrf';
	const KEY_FRAME_PACK = 'vfpq',
		KEY_INTERPRETATION = 'vpci',
		KEY_SAR = 'vsar';

	const toolset = [
		{ bit: 0, tool: 'sps_btt_flag' },
		{ bit: 1, tool: 'sps_suco_flag' },
		{ bit: 2, tool: 'sps_amvr_flag' },
		{ bit: 3, tool: 'sps_mmvd_flag' },
		{ bit: 4, tool: 'sps_affine_flag' },
		{ bit: 5, tool: 'sps_dmvr_flag' },
		{ bit: 6, tool: 'sps_alf_flag' },
		{ bit: 7, tool: 'sps_admvp_flag' },
		{ bit: 8, tool: 'sps_eipd_flag' },
		{ bit: 9, tool: 'sps_adcc_flag' },
		{ bit: 10, tool: 'sps_ibc_flag' },
		{ bit: 11, tool: 'sps_iqt_flag' },
		{ bit: 12, tool: 'sps_htdf_flag' },
		{ bit: 13, tool: 'sps_addb_flag' },
		{ bit: 14, tool: 'sps_cm_init_flag' },
		{ bit: 15, tool: 'sps_ats_flag' },
		{ bit: 16, tool: 'sps_rpl_flag' },
		{ bit: 17, tool: 'sps_pocs_flag' },
		{ bit: 18, tool: 'sps_dquant_flag' },
		{ bit: 19, tool: 'sps_dra_flag' },
		{ bit: 20, tool: 'sps_hmvp_flag' },
	];

	const args = [
		{
			key: KEY_PROFILE,
			label: 'Profile',
			value: 1,
			default: true,
			printFn: printProfile,
		},
		{
			key: KEY_LEVEL,
			label: 'Level',
			value: 51,
			default: true,
			printFn: printLevel,
		},
		{
			key: KEY_TOOLSET_HIGH,
			label: 'Toolset High',
			value: 0x1fffff,
			default: true,
			deferredPrint: true,
		},
		{
			key: KEY_TOOLSET_LOW,
			label: 'Toolset Low',
			value: 0x000000,
			default: true,
			deferredPrint: true,
		},
		{
			key: KEY_BIT_DEPTH,
			label: 'Bit Depth',
			value: 0,
			default: true,
			printFn: printBitDepth,
		},
		{
			key: KEY_CHROMA,
			label: 'Chroma Subsampling',
			value: 420,
			default: true,
			printFn: printChroma,
		},
		{
			key: KEY_PRIMARIES,
			label: 'Colour Primaries',
			value: 1,
			default: true,
			printFn: printColourPrimaries,
		},
		{
			key: KEY_XFER_CHAR,
			label: 'Transfer Characteristics',
			value: 1,
			default: true,
			printFn: printTransferCharacteristics,
		},
		{
			key: KEY_MATRIX_COEFF,
			label: 'Matrix Coefficients',
			value: 1,
			default: true,
			printFn: printMatrixCoefficients,
		},
		{ key: KEY_FULL_RANGE, label: 'Full Range Flag', value: 1, default: true },
		{
			key: KEY_FRAME_PACK,
			label: 'Frame Packing Type',
			value: null,
			default: true,
			printFn: printFramePackingType,
		},
		{
			key: KEY_INTERPRETATION,
			label: 'Packed Content Interpretation',
			value: null,
			default: true,
			printFn: printPackedContentInterpretationType,
		},
		{
			key: KEY_SAR,
			label: 'Sample Aspect Ratio',
			value: 1,
			default: true,
			printFn: printSampleAspectRatio,
		},
	];

	const res = [];

	for (let i = 1; i < parts.length; i++) {
		const key = parts[i].substring(0, 4);
		const value = parts[i].substring(4);
		switch (key.toLowerCase()) {
			case KEY_PROFILE: {
				const ProfileRegex = /^\d+$/;
				const k = SetKeyValue(args, key, value, ProfileRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_LEVEL: {
				const LevelRegex = /^\d+$/;
				const k = SetKeyValue(args, key, value, LevelRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_TOOLSET_HIGH: {
				const ToolsetHighRegex = /^[a-f\d]{6}$/i;
				const k = SetKeyValue(args, key, value, ToolsetHighRegex, true);
				if (k) res.push(k);
				break;
			}
			case KEY_TOOLSET_LOW: {
				const ToolsetLowRegex = /^[a-f\d]{6}$/i;
				const k = SetKeyValue(args, key, value, ToolsetLowRegex, true);
				if (k) res.push(k);
				break;
			}
			case KEY_BIT_DEPTH: {
				const BitDepthRegex = /^\d\d$/i;
				const k = SetKeyValue(args, key, value, BitDepthRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_CHROMA: {
				const ChromaRegex = /^\d{3}$/;
				const k = SetKeyValue(args, key, value, ChromaRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_PRIMARIES: {
				const ColourPrimariesRegex = /^\d{2}$/;
				const k = SetKeyValue(args, key, value, ColourPrimariesRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_XFER_CHAR: {
				const TransferCharacteristicsRegex = /^\d{2}$/;
				const k = SetKeyValue(args, key, value, TransferCharacteristicsRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_MATRIX_COEFF: {
				const MatrixCoefficientsRegex = /^\d{2}$/;
				const k = SetKeyValue(args, key, value, MatrixCoefficientsRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_FULL_RANGE: {
				const FullRangeFlagRegex = /^[01]$/;
				const k = SetKeyValue(args, key, value, FullRangeFlagRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_FRAME_PACK: {
				const FramePackingRegex = /^[01]\d$/;
				const k = SetKeyValue(args, key, value, FramePackingRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_INTERPRETATION: {
				const PackedContentInterpretationTypeRegex = /^\d$/;
				const k = SetKeyValue(args, key, value, PackedContentInterpretationTypeRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_SAR: {
				const SampleAspectRatioRegex = /^\d{2}$/;
				const k = SetKeyValue(args, key, value, SampleAspectRatioRegex);
				if (k) res.push(k);
				break;
			}
			default:
				res.push(error('invalid key specified (' + key + ')'));
				break;
		}
	}

	args.forEach((k) => {
		if (!k?.deferredPrint) {
			let xtra = {};
			if (k.printFn) xtra = k.printFn(k);
			else xtra.value = k.value;
			res.push({ ...{ name: `${k.label} (${k.key})`, is_default: k.default }, ...xtra });
		}
	});
	res.push(...printToolset(args));

	return res;
}

function evcHTML(label, messages) {
	// const TABLE_STYLE = '<style>table {border-collapse: collapse;border: 1px solid black;} th, td {text-align: left; padding: 8px;} tr:nth-child(even) {background-color: #f2f2f2;}</style>';
	const TABLE_STYLE =
		'<style>table {border-collapse: collapse;border: none;} th, td {text-align: left; padding: 8px;} ' +
		'tr {border-bottom: 1pt solid black;} tr:nth-child(even) {background-color: #f2f2f2;}</style > ';
	function printHex3(value) {
		let enc = value.toString(16);
		while (enc.length < 6) enc = '0' + enc;
		return `0x${enc}`;
	}

	let res = '';
	if (label) res += bold(HTMLsafe(label)) + BREAK;
	res += TABLE_STYLE + '<table>';
	messages.forEach((msg) => {
		res += '<tr>';
		if (msg?.name) {
			res += cell(msg.name);
			let desc = '';
			if (msg?.decode) desc = msg.decode;
			else if (msg?.warning) desc = warn(msg.warning);
			else if (msg?.description) {
				switch (datatypeIs(msg.description)) {
					case 'string':
						desc = msg.description;
						break;
					case 'array':
						msg.description.forEach((d) => {
							if (datatypeIs(d, 'string')) desc += d + BREAK;
							else if (datatypeIs(d, 'object')) {
								if (d?.title) desc += bold(d.title);
								if (d?.warning) desc += warn(d.warning);
								else if (d?.label && Object.prototype.hasOwnProperty.call(d, 'value')) {
									desc += d.label + ': ';
									if (datatypeIs(d.value, 'string') || datatypeIs(d.value, 'number')) desc += d.value;
									else if (datatypeIs(d.value, 'object')) {
										if (d.value?.warning) desc += warn(d.value.warning);
									}
								}
								desc += BREAK;
							}
						});
						break;
					case 'object':
						if (msg.description?.error) desc = err(msg.description.error);
						else if (msg.description?.warning) desc = warn(msg.description.warning);
						break;
					default:
						desc = warn('unrecognised description');
						break;
				}
			}
			res += msg.value != null ? cell(msg.value) + cell(desc) : cell(desc, 2);
			res += cell(msg?.is_default ? dflt('default') : '');
		} else if (msg?.toolset) {
			const toolset = msg.toolset;
			res += cell(`${toolset.label} (${toolset.key})`);
			res += cell(toolset.value != null ? printHex3(toolset.value) : warn('novalue'));
			let tools = '';
			if (toolset.description)
				toolset.description.forEach((d) => {
					tools += d.tool + ' ' + d.description + (d.error ? ` ${err(HTMLsafe(d.error))}` : '') + BREAK;
				});
			if (tools.length) res += cell(tools, 1, 2);
			res += cell(toolset?.is_default ? dflt('default') : '');
		} else if (msg?.error) res += cell(err(msg.error), 4);
		else res += cell(err(`invalid element ${JSON.stringify(msg)}`), 4);
		res += '</tr>';
	});
	res += '</table>';
	return `${res}${debugging ? `${LINE}${jsonHTML(label, messages)}` : ''}`;
}

export function registerEVC(addHandler) {
	addHandler('evc1', 'MPEG Essential Video Coding', decodeEVC, evcHTML);
}
