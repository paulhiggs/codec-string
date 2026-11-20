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
import { error, warning, normal, info } from './decode.js';
import { hexDigits } from './utils.js';
import { sscanf } from './sscanf-func.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';

// general_level_idc is 30 times the level number in Table A.8 of Rec. ITU-T H.265 (Annex A.4.1)
const HEVClevels = {
	30: '1',
	60: '2',
	63: '2.1',
	90: '3',
	93: '3.1',
	120: '4',
	123: '4.1',
	150: '5',
	153: '5.1',
	156: '5.2',
	180: '6',
	183: '6.1',
	186: '6.2',
	189: '6.3',
	210: '7',
	213: '7.1',
	216: '7.2',
	// level 8.5 is not in Table A.8: it labels bitstreams that can exceed the limits of all other levels
	255: '8.5',
};

export function decodeHEVC(val) {

	function HEVCprofile(gopocf, gm8bcf) {
		if (profileOrCompatible(1)) return { str: 'Main (1)', profile: 'Main' };
		if (profileOrCompatible(2)) return { str: `Main 10 ${gopocf ? 'Still Picture ' : ''}(2)`, profile: 'Main 10' };
		if (profileOrCompatible(3)) return { str: 'Main Still Picture (3)', profile: 'Main Still' };
		if (profileOrCompatible(4)) return { str: 'Range Extensions (4)' };
		if (profileOrCompatible(5)) return { str: 'High Throughput (5)', profile: 'High Throughput' };
		// profile names according to Annexes A, G, H and I of Rec. ITU-T H.265 (V11)
		if (profileOrCompatible(6)) return { str: `Multiview Main ${gm8bcf ? '' : '10 '}(6)`, profile: gm8bcf ? 'Multiview Main' : 'Multiview Main 10' };
		if (profileOrCompatible(7)) return { str: `Scalable Main ${gm8bcf ? '' : '10 '}(7)`, profile: 'Scalable Main' };
		if (profileOrCompatible(8)) return { str: '3D Main (8)', profile: '3D Main' };
		if (profileOrCompatible(9)) return { str: 'Screen Content Coding (9)', profile: 'Screen Content' };
		if (profileOrCompatible(10)) return { str: 'Scalable Format Range Extensions (10)', profile: 'Scalable Format Range Extensions' };
		if (profileOrCompatible(11)) return { str: 'High Throughput Screen Content Coding (11)', profile: 'High Throughput Screen Content' };
		if (profileOrCompatible(12)) return { str: 'Multiview Extended (12)', profile: 'Multiview Extended' };
		if (profileOrCompatible(13)) return { str: 'Multiview Extended 10 (13)', profile: 'Multiview Extended 10' };
		if (profileOrCompatible(14)) return { str: 'Multiview Format Range Extensions (14)', profile: 'Multiview Format Range Extensions' };
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
	// see annex E.3 of ISO/IEC 14496-15: general_profile_space is no character (0) or 'A', 'B', 'C' (1, 2, 3),
	// followed by general_profile_idc as a decimal number
	const profileParts = parts[1].match(/^(?<space>[A-Ca-c]?)(?<idc>\d+)$/);
	if (!profileParts)
		argErr.push(error(`invalid general_profile_space and general_profile_idc (${parts[1]}), expected an optional A, B or C followed by a decimal number`));
	const space = profileParts?.groups.space ?? '';
	const general_profile_space = space ? 'ABC'.indexOf(space.toUpperCase()) + 1 : 0,
		general_profile_idc = parseInt(profileParts?.groups.idc, 10);
	const profileSpaceWarning =
		space && space != space.toUpperCase() ? warning(`general_profile_space should be uppercase (${space.toUpperCase()}), not ${space}`) : null;

	// true when general_profile_idc is one of the given values, or the codecs string signals compatibility with one of them.
	// Note: general_profile_compatibility_flag[ j ] is read from bit j-1 here, see #57
	const profileOrCompatible = (...idcs) =>
		idcs.some((idc) => general_profile_idc == idc || bitSet32(general_profile_compatibility_flag, idc - 1));

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

	// the conditions below follow profile_tier_level( ) in clause 7.3.3 of Rec. ITU-T H.265 (V11)
	if (profileOrCompatible(4, 5, 6, 7, 8, 9, 10, 11)) {
		constraints.push(normal(`general_max_12bit_constraint_flag=${showbit(constraintFlags.bitset(44))}`));
		constraints.push(normal(`general_max_10bit_constraint_flag=${showbit(constraintFlags.bitset(43))}`));
		general_max_8bit_constraint_flag = constraintFlags.bitset(42);
		constraints.push(normal(`general_max_8bit_constraint_flag=${showbit(general_max_8bit_constraint_flag)}`));
		constraints.push(normal(`general_max_422chroma_constraint_flag=${showbit(constraintFlags.bitset(41))}`));
		constraints.push(normal(`general_max_420chroma_constraint_flag=${showbit(constraintFlags.bitset(40))}`));
		constraints.push(normal(`general_max_monochrome_constraint_flag=${showbit(constraintFlags.bitset(39))}`));
		constraints.push(normal(`general_intra_constraint_flag=${showbit(constraintFlags.bitset(38))}`));
		constraints.push(normal(`general_one_picture_only_constraint_flag=${showbit(constraintFlags.bitset(37))}`));
		general_one_picture_only_constraint_flag = constraintFlags.bitset(37);
		constraints.push(normal(`general_lower_bit_rate_constraint_flag=${showbit(constraintFlags.bitset(36))}`));

		if (profileOrCompatible(5, 9, 10, 11)) {
			constraints.push(normal(`general_max_14bit_constraint_flag=${showbit(constraintFlags.bitset(35))}`));
			// general_reserved_zero_33bits
		} else {
			// general_reserved_zero_34bits
		}
	} else if (profileOrCompatible(2)) {
		// general_reserved_zero_7bits
		constraints.push(normal(`general_one_picture_only_constraint_flag=${showbit(constraintFlags.bitset(37))}`));
		general_one_picture_only_constraint_flag = constraintFlags.bitset(37);
		//general_reserved_zero_35bits
	} else {
		// general_reserved_zero_43bits
	}

	if (profileOrCompatible(1, 2, 3, 4, 5, 9, 11)) {
		constraints.push(normal(`general_inbld_flag=${showbit(constraintFlags.bitset(1))}`));
	} else {
		// general_reserved_zero_bit
	}

	res.push(normal(`general_profile_space=${general_profile_space}`));
	if (profileSpaceWarning) res.push(profileSpaceWarning);

	const profile = HEVCprofile(general_one_picture_only_constraint_flag, general_max_8bit_constraint_flag);
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

	const lev = HEVClevels[tier[1]];
	if (!lev) res.push(error(`unknown Level (${tier[1]})`));
	else {
		res.push(normal(`Level ${lev}`));
		coding_params.level = lev;
		// see Annex A.4.1 of Rec. ITU-T H.265: the High tier is only specified for level 4 and above
		if (coding_params.tier == 'High' && tier[1] < 120) res.push(warning(`High Tier is not specified for Level ${lev}, only for Level 4 and above`));
		// see Annex A.4.1 of Rec. ITU-T H.265: general_tier_flag shall be equal to 1 (High tier) for level 8.5
		if (coding_params.tier == 'Main' && tier[1] == 255) res.push(warning('Level 8.5 requires the High Tier (H)'));
	}
	res.push(...constraints);

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function decodeHEVCLayerInfo(val) {
	const rx = /lhevcptl="(.*)"/g;
	const arr = rx.exec(val);
	// lhevcptl is a MIME parameter (ISO/IEC 14496-15), so it is not present when only the codecs string is provided
	if (!arr?.[1]) return [info('no LHEVC ProfileTierLevel information')];

	const res = [];
	// arr[1] contains the value provided in the lhevcptl mime parameter
	const parts = arr[1].split(",");
	const BLInternal = parseInt(parts[0]);
  switch (BLInternal) {
		case 0:
			res.push(normal('Coded pictures with nuh_layer_id==0 are not present in the bitstream.'));
			break;
		case 1:
			res.push(normal('Coded pictures with nuh_layer_id==0 may be present in the bitstream.'));
			break;
		default:
			res.push(error(`invalid value for BLInternal (${parts[0]})`));
	}
	for (let i=1; i<parts.length; i++) {
		const p2 = parts[i].split(".");
		if (p2.length < 3)
			res.push(error(`invalid format for ListItem${i} (${parts[i]})`));
		else {
			let listitem = `ListItem${i}: OlsIdx=${p2[0]}, MaxTid=${p2[1]}, PTL1=${p2[2]}`;
			for (let j=3; j<p2.length; j++) 
				listitem += `, PTL${j-1}=${p2[j]}`;
			res.push(normal(listitem));
		}
	}

	return res;
}

export function registerHEVC(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler(['hev1', 'hvc1', 'hev2', 'hvc2','hev3', 'hvc3'], 'HEVC/H.265', decodeHEVC, outputHTML);
	addHandler(['lhv1', 'lhe1'], 'Layered HEVC', decodeHEVCLayerInfo, outputHTML);
}
