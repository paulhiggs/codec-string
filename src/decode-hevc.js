/**
 * @copyright: Copyright (c) 2021-2024
 * @author: Paul Higgs
 * @file: decode-hevc.js
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

import { BitList, bitSet32 } from './bits.js';
import { error, normal } from './decode.js';
import { hexDigits } from './utils.js';
import { sscanf } from './sscanf-func.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';

export function decodeHEVC(val) {
	// regex from DVB TM-STREAM0087: /(hev1|hvc1)\.[a-zA-Z]?\d{1,3}\.[a-fa-F\d]{1,8}\.[LH]\d{1,3}/
	// but needs to include the 6 btyes from the decoder constraint flags

	// const HEVCregex = /^(hev1|hvc1)\.[a-zA-Z]?\d{1,3}\.[a-fA-F\d]{1,8}\.[LH]\d{1,3}(\.[a-fA-F\d]{1,2}){1,6}$/;

	function HEVCprofile(general_profile_idc, cap, gopocf, gm8bcf) {
		if (general_profile_idc == 1 || bitSet32(cap, 0)) return { str: 'Main (1)', profile: 'Main' };
		if (general_profile_idc == 2 || bitSet32(cap, 1)) return { str: `Main 10 ${gopocf ? 'Still Picture ' : ''}(2)`, profile: 'Main 10' };
		if (general_profile_idc == 3 || bitSet32(cap, 2)) return { str: 'Main Still Picture (3)', profile: 'Main Still' };
		if (general_profile_idc == 4 || bitSet32(cap, 3)) return { str: 'Range Extensions (4)' };
		if (general_profile_idc == 5 || bitSet32(cap, 4)) return { str: 'High Throughput (5)', profile: 'High Throughput' };
		if (general_profile_idc == 6 || bitSet32(cap, 5)) return { str: 'Multiview Main (6)', profile: 'Multiview Main' };
		if (general_profile_idc == 7 || bitSet32(cap, 6)) return { str: `Scalable Main ${gm8bcf ? '' : '10 '}(7)`, profile: 'Scalable Main' };
		if (general_profile_idc == 8 || bitSet32(cap, 7)) return { str: '3D Main (8)', profile: '3D Main' };
		if (general_profile_idc == 9 || bitSet32(cap, 8)) return { str: 'Screen Content Coding (9)', profile: 'Screen Content' };
		if (general_profile_idc == 10 || bitSet32(cap, 9)) return { str: 'Multiview (10)', profile: 'Multiview' };
		if (general_profile_idc == 11 || bitSet32(cap, 10)) return { str: 'High Throughput Screen Content Coding (11)', profile: 'High Throughput Screen Content' };
		if (general_profile_idc == 12 || bitSet32(cap, 11)) return { str: 'Multiview extended (12)', profile: 'Multiview extended' };
		if (general_profile_idc == 13 || bitSet32(cap, 12)) return { str: 'Multiview extended 10 (13)', profile: 'Multiview extended 10' };
		return error('unknown profile');
	}

	const showbit = (v) => (v ? '1' : '0');

	const parts = val.split('.');

	if (parts.length < 5) return [error('HEVC codec requires at least 5 parts')];

	const coding_params = { type: 'video', codec: parts[0] };
	const argErr = [],
		res = [];

	if (!hexDigits(parts[2])) argErr.push(error(`general_profile_compatibility_flag not expressed in hexadecimal (${parts[2]})`));

	const general_profile_compatibility_flag = parseInt(parts[2], 16);
	let general_profile_idc = -1,
		general_profile_space = -1;

	if (parts[1][0] == 'A' || parts[1][0] == 'B' || parts[1][0] == 'C') {
		const gp = sscanf(parts[1], '%c%d');
		switch (gp[0].toUpperCase()) {
			case 'A':
				general_profile_space = 1;
				break;
			case 'B':
				general_profile_space = 2;
				break;
			case 'C':
				general_profile_space = 3;
				break;
		}
		general_profile_idc = gp[1];
	} else {
		general_profile_space = 0;
		general_profile_idc = parseInt(parts[1]);
	}

	// process the constraints as we need to extract the general_one_picture_only_constraint_flag

	const constraintFlags = new BitList();
	let i = 4;
	while (i < 10) {
		let bFlags = 0;
		if (parts[i]) {
			if (!hexDigits(parts[i])) argErr.push(error(`constraint flags not specified in hexadecimal (${parts[i]})`));
			else bFlags = parseInt(parts[i].toLowerCase(), 16);
		}
		constraintFlags.push(bFlags);
		i++;
	}

	if (argErr.length) return argErr;

	const constraints = [];
	let general_one_picture_only_constraint_flag,
		general_max_8bit_constraint_flag = 0;
	constraints.push({ informative: `constraintFlags=${constraintFlags.toString()}` });

	const general_progressive_source_flag = constraintFlags.bitset(48),
		general_interlaced_source_flag = constraintFlags.bitset(47);

	if (general_progressive_source_flag && !general_interlaced_source_flag) constraints.push(normal('scan=progressive'));
	else if (!general_progressive_source_flag && general_interlaced_source_flag) constraints.push(normal('scan=interlaced'));
	else if (general_progressive_source_flag && general_interlaced_source_flag) constraints.push(normal('scan=source_scan_type in SEI'));
	else constraints.push(error('scan=unknown or unspecified'));

	constraints.push(normal(`general_non_packed_constraint_flag=${showbit(constraintFlags.bitset(46))}`));
	constraints.push(normal(`general_frame_only_constraint_flag=${showbit(constraintFlags.bitset(45))}`));

	if (
		general_profile_idc == 4 ||
		bitSet32(general_profile_compatibility_flag, 3) ||
		general_profile_idc == 5 ||
		bitSet32(general_profile_compatibility_flag, 4) ||
		general_profile_idc == 6 ||
		bitSet32(general_profile_compatibility_flag, 5) ||
		general_profile_idc == 7 ||
		bitSet32(general_profile_compatibility_flag, 6) ||
		general_profile_idc == 8 ||
		bitSet32(general_profile_compatibility_flag, 7) ||
		general_profile_idc == 9 ||
		bitSet32(general_profile_compatibility_flag, 8) ||
		general_profile_idc == 10 ||
		bitSet32(general_profile_compatibility_flag, 9) ||
		general_profile_idc == 11 ||
		bitSet32(general_profile_compatibility_flag, 10)
	) {
		constraints.push(normal(`general_max_12bit_constraint_flag=${showbit(constraintFlags.bitset(44))}`));
		constraints.push(normal(`general_max_10bit_constraint_flag=${showbit(constraintFlags.bitset(43))}`));
		general_max_8bit_constraint_flag = constraintFlags.bitset(42);
		constraints.push(normal(`general_max_8bit_constraint_flag=${showbit(general_max_8bit_constraint_flag)}`));
		constraints.push(normal(`general_max_422chroma_constraint_flag=${showbit(constraintFlags.bitset(41))}`));
		constraints.push(normal(`general_max_420chroma_constraint_flag=${showbit(constraintFlags.bitset(40))}`));
		constraints.push(normal(`general_max_monochrome_constraint_flag=${showbit(constraintFlags.bitset(39))}`));
		constraints.push(normal(`general_intra_constraint_flag=${showbit(constraintFlags.bitset(38))}`));
		constraints.push(normal(`general_one_picture_only_constraint_flag="${showbit(constraintFlags.bitset(37))}`));
		general_one_picture_only_constraint_flag = constraintFlags.bitset(37);
		constraints.push(normal(`general_lower_bit_rate_constraint_flag=${showbit(constraintFlags.bitset(36))}`));

		if (
			general_profile_idc == 5 ||
			bitSet32(general_profile_compatibility_flag, 4) ||
			general_profile_idc == 9 ||
			bitSet32(general_profile_compatibility_flag, 8) ||
			general_profile_idc == 10 ||
			bitSet32(general_profile_compatibility_flag, 9) ||
			general_profile_idc == 11 ||
			bitSet32(general_profile_compatibility_flag, 10)
		) {
			constraints.push(normal(`general_max_12bit_constraint_flag=${showbit(constraintFlags.bitset(35))}`));
			// general_reserved_zero_33bits
		} else {
			// general_reserved_zero_34bits
		}
	} else if (general_profile_idc == 2 || bitSet32(general_profile_compatibility_flag, 1)) {
		// general_reserved_zero_7bits
		constraints.push(normal(`general_one_picture_only_constraint_flag=${showbit(constraintFlags.bitset(37))}`));
		general_one_picture_only_constraint_flag = constraintFlags.bitset(37);
		//general_reserved_zero_35bits
	} else {
		// general_reserved_zero_43bits
	}

	if (
		general_profile_idc == 1 ||
		bitSet32(general_profile_compatibility_flag, 0) ||
		general_profile_idc == 2 ||
		bitSet32(general_profile_compatibility_flag, 1) ||
		general_profile_idc == 3 ||
		bitSet32(general_profile_compatibility_flag, 2) ||
		general_profile_idc == 4 ||
		bitSet32(general_profile_compatibility_flag, 3) ||
		general_profile_idc == 5 ||
		bitSet32(general_profile_compatibility_flag, 4) ||
		general_profile_idc == 9 ||
		bitSet32(general_profile_compatibility_flag, 8) ||
		general_profile_idc == 11 ||
		bitSet32(general_profile_compatibility_flag, 10)
	) {
		constraints.push(normal(`general_inbld_flag=${showbit(constraintFlags.bitset(1))}`));
	} else {
		// general_reserved_zero_bit
	}

	res.push(general_profile_space == -1 ? error('general_profile_space=') : normal(`general_profile_space=${general_profile_space}`));

	const profile = HEVCprofile(
		general_profile_idc,
		general_profile_compatibility_flag,
		general_one_picture_only_constraint_flag,
		general_max_8bit_constraint_flag
	);
	if (profile?.error) res.push(error(profile.error));
	if (profile?.profile) coding_params.profile = profile.profile;
	if (profile?.str) res.push(normal(`general_profile_idc=${profile.str}`));

	const tier = sscanf(parts[3], '%c%d');
	switch (tier[0].toUpperCase()) {
		case 'L':
			res.push(normal('Main Tier (L)'));
			coding_params.tier = 'Main';
			break;
		case 'H':
			res.push(normal('High Tier (H)'));
			coding_params.tier = 'High';
			break;
		default:
			res.push(error(`unknown Tier (${tier[0]})`));
			break;
	}

	let lev = null;
	switch (tier[1]) {
		case 30:
			lev = '1';
			break;
		case 60:
			lev = '2';
			break;
		case 63:
			lev = '2.1';
			break;
		case 90:
			lev = '3';
			break;
		case 93:
			lev = '3.1';
			break;
		case 120:
			lev = '4';
			break;
		case 123:
			lev = '4.1';
			break;
		case 150:
			lev = '5';
			break;
		case 153:
			lev = '5.1';
			break;
		case 156:
			lev = '5.2';
			break;
		case 180:
			lev = '6';
			break;
		case 183:
			lev = '6.1';
			break;
		case 186:
			lev = '6.2';
			break;
		default:
			res.push(error(`unknown Level (${tier[1]})`));
	}
	if (lev) {
		res.push(normal(`Level ${lev}`));
		coding_params.level = lev;
	}
	res.push(...constraints);

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function registerHEVC(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler(['hev1', 'hvc1'], 'HEVC/H.265', decodeHEVC, outputHTML);
	addHandler('lhv1', 'Layered HEVC');
}
