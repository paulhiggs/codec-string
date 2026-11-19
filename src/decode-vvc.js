/**
 * @copyright: Copyright (c) 2021-2024
 * @author: Paul Higgs
 * @file: decode-vvc.js
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

// see annex E.6 through E.8 of  ISO/IEC 14496-15:2025 (7th edition)
//

// VVC is ISO/IEC 23090-3:2026 (MDS25742-N378) [https://dms.mpeg.expert/doc_end_user/documents/152_Geneva/wg11/MDS25742_WG05_N00378.zip]
//     and ITU-T H.266 v4 [https://www.itu.int/ITU-T/recommendations/rec.aspx?rec=16662&lang=en]

const DEBUGGING = false;

import { BitList } from './bits.js';
import { normal, error, warning } from './decode.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';
import { expressions } from './regular_expressions.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // RFC 4648, clause 6

// convert an RFC 4648 base32 string (without '=' padding) to a string of '0'/'1' characters, most significant bit first
// returns null if the string contains a character that is not in the base32 alphabet
function base32ToBits(str) {
	let bits = '';
	for (const ch of str.toUpperCase()) {
		const value = BASE32_ALPHABET.indexOf(ch);
		if (value < 0) return null;
		bits += value.toString(2).padStart(5, '0');
	}
	return bits;
}

// general_profile_idc values, table A.1 in VVC
const VVC_profiles = {
	1: 'Main 10',
	2: 'Main 12',
	10: 'Main 12 Intra',
	17: 'Multilayer Main 10',
	33: 'Main 10 4:4:4',
	34: 'Main 12 4:4:4',
	35: 'Main 16 4:4:4',
	42: 'Main 12 4:4:4 Intra',
	43: 'Main 16 4:4:4 Intra',
	49: 'Multilayer Main 10 4:4:4',
	65: 'Main 10 Still Picture',
	66: 'Main 12 Still Picture',
	97: 'Main 10 4:4:4 Still Picture',
	98: 'Main 12 4:4:4 Still Picture',
	99: 'Main 16 4:4:4 Still Picture',
};

const VVC_tiers = {
	L: 'Main Tier (L)',
	H: 'High Tier (H)',
};

// op_level_idc values, table 135 in VVC
const VVC_levels = {
	16: '1.0',
	32: '2.0',
	35: '2.1',
	48: '3.0',
	51: '3.1',
	64: '4.0',
	67: '4.1',
	80: '5.0',
	83: '5.1',
	86: '5.2',
	96: '6.0',
	99: '6.1',
	102: '6.2',
	105: '6.3',
	255: '15.5',
};
const VVC_HIGH_TIER_MIN_LEVEL_IDC = 64; // Level 4.0
const VVC_MAX_TEMPORAL_ID = 6; // sps_max_sublayers_minus1 is in the range 0..6

const VVC_general_constraints = [
	{ bit: 0, name: 'gci_present_flag', existence: true },
	{ bit: 1, name: 'gci_intra_only_constraint_flag' },
	{ bit: 2, name: 'gci_all_layers_independent_constraint_flag' },
	{ bit: 3, name: 'gci_one_au_only_constraint_flag' },
	{
		bit: 4,
		name: 'gci_sixteen_minus_max_bitdepth_constraint_idc',
		length: 4,
	},
	{
		bit: 8,
		name: 'gci_three_minus_max_chroma_format_constraint_idc',
		length: 2,
	},
	{ bit: 10, name: 'gci_no_mixed_nalu_types_in_pic_constraint_flag' },
	{ bit: 11, name: 'gci_no_trail_constraint_flag' },
	{ bit: 12, name: 'gci_no_stsa_constraint_flag' },
	{ bit: 13, name: 'gci_no_rasl_constraint_flag' },
	{ bit: 14, name: 'gci_no_radl_constraint_flag' },
	{ bit: 15, name: 'gci_no_idr_constraint_flag' },
	{ bit: 16, name: 'gci_no_cra_constraint_flag' },
	{ bit: 17, name: 'gci_no_gdr_constraint_flag' },
	{ bit: 18, name: 'gci_no_aps_constraint_flag' },
	{ bit: 19, name: 'gci_no_idr_rpl_constraint_flag' },
	{ bit: 20, name: 'gci_one_tile_per_pic_constraint_flag' },
	{ bit: 21, name: 'gci_pic_header_in_slice_header_constraint_flag' },
	{ bit: 22, name: 'gci_one_slice_per_pic_constraint_flag' },
	{ bit: 23, name: 'gci_no_rectangular_slice_constraint_flag' },
	{ bit: 24, name: 'gci_one_slice_per_subpic_constraint_flag' },
	{ bit: 25, name: 'gci_no_subpic_info_constraint_flag' },
	{
		bit: 26,
		name: 'gci_three_minus_max_log2_ctu_size_constraint_idc',
		length: 2,
	},
	{ bit: 28, name: 'gci_no_partition_constraints_override_constraint_flag' },
	{ bit: 29, name: 'gci_no_mtt_constraint_flag' },
	{ bit: 30, name: 'gci_no_qtbtt_dual_tree_intra_constraint_flag' },
	{ bit: 31, name: 'gci_no_palette_constraint_flag' },
	{ bit: 32, name: 'gci_no_ibc_constraint_flag' },
	{ bit: 33, name: 'gci_no_isp_constraint_flag' },
	{ bit: 34, name: 'gci_no_mrl_constraint_flag' },
	{ bit: 35, name: 'gci_no_mip_constraint_flag' },
	{ bit: 36, name: 'gci_no_cclm_constraint_flag' },
	{ bit: 37, name: 'gci_no_ref_pic_resampling_constraint_flag' },
	{ bit: 38, name: 'gci_no_res_change_in_clvs_constraint_flag' },
	{ bit: 39, name: 'gci_no_weighted_prediction_constraint_flag' },
	{ bit: 40, name: 'gci_no_ref_wraparound_constraint_flag' },
	{ bit: 41, name: 'gci_no_temporal_mvp_constraint_flag' },
	{ bit: 42, name: 'gci_no_sbtmvp_constraint_flag' },
	{ bit: 43, name: 'gci_no_amvr_constraint_flag' },
	{ bit: 44, name: 'gci_no_bdof_constraint_flag' },
	{ bit: 45, name: 'gci_no_smvd_constraint_flag' },
	{ bit: 46, name: 'gci_no_dmvr_constraint_flag' },
	{ bit: 47, name: 'gci_no_mmvd_constraint_flag' },
	{ bit: 48, name: 'gci_no_affine_motion_constraint_flag' },
	{ bit: 49, name: 'gci_no_prof_constraint_flag' },
	{ bit: 50, name: 'gci_no_bcw_constraint_flag' },
	{ bit: 51, name: 'gci_no_ciip_constraint_flag' },
	{ bit: 52, name: 'gci_no_gpm_constraint_flag' },
	{ bit: 53, name: 'gci_no_luma_transform_size_64_constraint_flag' },
	{ bit: 54, name: 'gci_no_transform_skip_constraint_flag' },
	{ bit: 55, name: 'gci_no_bdpcm_constraint_flag' },
	{ bit: 56, name: 'gci_no_mts_constraint_flag' },
	{ bit: 57, name: 'gci_no_lfnst_constraint_flag' },
	{ bit: 58, name: 'gci_no_joint_cbcr_constraint_flag' },
	{ bit: 59, name: 'gci_no_sbt_constraint_flag' },
	{ bit: 60, name: 'gci_no_act_constraint_flag' },
	{ bit: 61, name: 'gci_no_explicit_scaling_list_constraint_flag' },
	{ bit: 62, name: 'gci_no_dep_quant_constraint_flag' },
	{ bit: 63, name: 'gci_no_sign_data_hiding_constraint_flag' },
	{ bit: 64, name: 'gci_no_cu_qp_delta_constraint_flag' },
	{ bit: 65, name: 'gci_no_chroma_qp_offset_constraint_flag' },
	{ bit: 66, name: 'gci_no_sao_constraint_flag' },
	{ bit: 67, name: 'gci_no_alf_constraint_flag' },
	{ bit: 68, name: 'gci_no_ccalf_constraint_flag' },
	{ bit: 69, name: 'gci_no_lmcs_constraint_flag' },
	{ bit: 70, name: 'gci_no_ladf_constraint_flag' },
	{ bit: 71, name: 'gci_no_virtual_boundaries_constraint_flag' },
	{ bit: 72, name: 'gci_num_additional_bits', length: 8 },
];
const GCI_ADDITIONAL_BITS_START = 80; // first bit after gci_num_additional_bits

// optional flags, present when gci_num_additional_bits > 5
const VVC_additional_constraints = [
	'gci_all_rap_pictures_constraint_flag',
	'gci_no_extended_precision_processing_constraint_flag',
	'gci_no_ts_residual_coding_rice_constraint_flag',
	'gci_no_rrc_rice_extension_constraint_flag',
	'gci_no_persistent_rice_adaptation_constraint_flag',
	'gci_no_reverse_last_sig_coeff_constraint_flag',
];

export function decodeVVC(val) {
	function printProfile(profile) {
		const prof = VVC_profiles[parseInt(profile)];
		return { output: [prof ? normal(prof) : error(`unknown Profile (${profile})`)], profile: prof ? prof : '' };
	}

	function printTier(tier, level) {
		const res = [],
			op_level_idc = parseInt(level),
			t = VVC_tiers[tier] || null,
			lev = VVC_levels[op_level_idc] || null;

		res.push(t ? normal(t) : error(`unknown Tier (${tier})`));
		res.push(lev ? normal(`Level ${lev}`) : error(`unknown Level (${op_level_idc})`));
		// VVC only specifies the High tier for Level 4 and above
		if (tier == 'H' && lev && op_level_idc < VVC_HIGH_TIER_MIN_LEVEL_IDC)
			res.push(warning(`High Tier is not specified for Level ${lev}, only for Level 4.0 and above`));
		return { output: res, tier: t, level: lev };
	}

	function printConstraints(constraint_info) {
		// 14496-15 says the 'C' value is ptl_frame_only_constraint_flag, ptl_multilayer_enabled_flag and then the
		// general_constraint_info() syntax structure, encoded as base32 (RFC 4648, clause 6). Trailing zero bits and '='
		// padding may be omitted, so missing bits at the tail are read as 0 and any bits beyond the end are ignored
		const GCI_OFFSET = 2; // general_constraint_info() starts after the two ptl_ flags

		let bits = base32ToBits(constraint_info);
		if (bits === null) return [error(`invalid base32 constraint info (${constraint_info})`)];
		while (bits.length % 8) bits += '0';

		const res = [],
			constraintFlags = new BitList();
		for (let i = 0; i < bits.length; i += 8) constraintFlags.push(parseInt(bits.substring(i, i + 8), 2));

		res.push({ diagnostic: constraintFlags.toString() });
		res.push({ diagnostic: bits });

		res.push(normal(`ptl_frame_only_constraint_flag=${constraintFlags.bitsetB(0)}`));
		res.push(normal(`ptl_multilayer_enabled_flag=${constraintFlags.bitsetB(1)}`));

		let gotFlags = false;
		VVC_general_constraints.forEach((constraint) => {
			const bit = constraint.bit + GCI_OFFSET;
			if (constraint.existence) {
				if (constraintFlags.bitsetB(bit)) gotFlags = true;
				res.push(normal(`${constraint.name}=${constraintFlags.bitsetB(bit)}`));
			} else if (gotFlags) {
				if (constraint.length) {
					res.push(normal(`${constraint.name}=${constraintFlags.valueB(bit, constraint.length)}`));
				} else if (constraintFlags.bitsetB(bit)) res.push(normal(constraint.name));
			}
		});

		if (gotFlags) {
			const gci_num_additional_bits = constraintFlags.valueB(VVC_general_constraints.at(-1).bit + GCI_OFFSET, 8);
			let pos = GCI_ADDITIONAL_BITS_START + GCI_OFFSET,
				numAdditionalBitsUsed = 0;
			if (gci_num_additional_bits > 5) {
				VVC_additional_constraints.forEach((name, i) => {
					if (constraintFlags.bitsetB(pos + i)) res.push(normal(name));
				});
				numAdditionalBitsUsed = VVC_additional_constraints.length;
				pos += numAdditionalBitsUsed;
			}
			const numReservedBits = gci_num_additional_bits - numAdditionalBitsUsed;
			if (numReservedBits > 0) {
				let reserved = '';
				for (let i = 0; i < numReservedBits; i++) reserved += constraintFlags.bitsetB(pos + i) ? '1' : '0';
				res.push(normal(`gci_reserved_bit[0..${numReservedBits - 1}]=${reserved}`));
			}
		}
		return res;
	}

	function printSubProfile(general_sub_profile_idc) {
		const res = [],
			subProfiles = general_sub_profile_idc.split('+');

		// VVC says
		//general_sub_profile_idc[ i ] specifies the i-th interoperability indicator registered as specified by Rec. ITU-T T.35,
		// the contents of which are not specified in this document.
		// ITU T.35 (2000) - Procedure for the allocation of ITU-T defined codes for non-standard facilities
		//
		// 14496-15 says each general_sub_profile_idc (u(32)) is encoded as base32 (RFC 4648, clause 6), trailing '=' padding
		// may be omitted, and bits beyond the end of the 32-bit syntax element are ignored

		for (let i = 0; i < subProfiles.length; i++) {
			const decoded = base32ToBits(subProfiles[i]);
			if (decoded === null) {
				res.push(error(`invalid base32 sub profile (${subProfiles[i]})`));
				continue;
			}
			const bits = decoded.substring(0, 32).padEnd(32, '0');
			const value = parseInt(bits, 2);
			res.push(normal(`Sub profile (${i + 1})=0x${value.toString(16).toUpperCase().padStart(8, '0')} (${value})`));
		}
		return res;
	}

	function printTemporalLayers(ols_idx, max_tid) {
		const res = [];
		if (ols_idx) res.push(normal(`Output Layer Set index ('OlsIdx')=${ols_idx}`));
		if (max_tid) {
			res.push(normal(`Maximum Temporal Id ('MaxTid')=${max_tid}`));
			// a VVC bitstream has at most 7 sublayers, so TemporalId is in the range 0..6
			if (parseInt(max_tid) > VVC_MAX_TEMPORAL_ID) res.push(warning(`MaxTid (${max_tid}) is greater than ${VVC_MAX_TEMPORAL_ID}`));
		}
		return res;
	}

	const result = val.match(expressions.VVC.regex_grouped);
	if (!result || !result.groups) return [error('Regex mismatch!'), error(expressions.VVC.format)];

	const { four_cc, profile, tier, level, constraints, sub_profiles, ols_idx, max_tid } = result.groups,
		res = [],
		coding_params = { type: 'video', codec: four_cc };

	const prof = printProfile(profile);
	res.push(...prof.output);
	coding_params.profile = prof.profile;

	const tier_and_level = printTier(tier, level);
	res.push(...tier_and_level.output);
	coding_params.tier = tier_and_level.tier;
	coding_params.level = tier_and_level.level;

	if (constraints) res.push(...printConstraints(constraints));
	if (sub_profiles) res.push(...printSubProfile(sub_profiles));
	if (ols_idx || max_tid) res.push(...printTemporalLayers(ols_idx, max_tid));

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function registerVVC(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler(['vvc1', 'vvi1'], 'MPEG Versatile Video Coding', decodeVVC, outputHTML);
	addHandler('vvcN', 'VVC non-VCL track');
	addHandler('vvs1', 'VVC subpicture track');
}
