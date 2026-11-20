/**
 * @copyright: Copyright (c) 2021-2026
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

// regular expressions for the codecs string
const expressions = {
	HEVC: {
		regex: /^(hev1|hvc1|hev2|hvc2|hev3|hvc3)\.([A-Ca-c]?\d{1,3})\.[a-fA-F\d]{1,8}\.[LH]\d{1,3}(\.[a-fA-F\d]{1,2}){1,6}$/,
		format: '<sample entry 4CC>.{A|B|C}<general_profile_idc>.<general_profile_compatibility_flags>.[LH]<general_level_idc>.<constraint byte>{.<constraint byte>}',
		description: 'see clause E.3 of ISO/IEC 14496-15: the compatibility flags are up to 8 hexadecimal digits, and there are 1 to 6 constraint bytes of 1 or 2 hexadecimal digits',
	},
};

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

// the profiles that general_profile_compatibility_flag[ j ] can signal, see Annexes A, G, H and I of Rec. ITU-T H.265 (V11)
const HEVCcompatibleProfileNames = {
	1: 'Main',
	2: 'Main 10',
	3: 'Main Still Picture',
	4: 'Format Range Extensions',
	5: 'High Throughput',
	6: 'Multiview Main',
	7: 'Scalable Main',
	8: '3D Main',
	9: 'Screen Content Coding',
	10: 'Scalable Format Range Extensions',
	11: 'High Throughput Screen Content Coding',
	12: 'Multiview Extended',
	13: 'Multiview Extended 10',
	14: 'Multiview Format Range Extensions',
};

// format range extensions profiles (general_profile_idc 4), see Table A.2 of Rec. ITU-T H.265 (V11)
// flags are general_max_12bit, max_10bit, max_8bit, max_422chroma, max_420chroma, max_monochrome, intra and one_picture_only
// general_lower_bit_rate_constraint_flag shall be 1, except for the Intra and Still Picture profiles where it can be 0 or 1
const FormatRangeExtensionsProfiles = [
	{ flags: '11111100', name: 'Monochrome' },
	{ flags: '11011100', name: 'Monochrome 10' },
	{ flags: '10011100', name: 'Monochrome 12' },
	{ flags: '00011100', name: 'Monochrome 16' },
	{ flags: '10011000', name: 'Main 12' },
	{ flags: '11010000', name: 'Main 4:2:2 10' },
	{ flags: '10010000', name: 'Main 4:2:2 12' },
	{ flags: '11100000', name: 'Main 4:4:4' },
	{ flags: '11000000', name: 'Main 4:4:4 10' },
	{ flags: '10000000', name: 'Main 4:4:4 12' },
	{ flags: '11111010', name: 'Main Intra', anyLowerBitRate: true },
	{ flags: '11011010', name: 'Main 10 Intra', anyLowerBitRate: true },
	{ flags: '10011010', name: 'Main 12 Intra', anyLowerBitRate: true },
	{ flags: '11010010', name: 'Main 4:2:2 10 Intra', anyLowerBitRate: true },
	{ flags: '10010010', name: 'Main 4:2:2 12 Intra', anyLowerBitRate: true },
	{ flags: '11100010', name: 'Main 4:4:4 Intra', anyLowerBitRate: true },
	{ flags: '11000010', name: 'Main 4:4:4 10 Intra', anyLowerBitRate: true },
	{ flags: '10000010', name: 'Main 4:4:4 12 Intra', anyLowerBitRate: true },
	{ flags: '00000010', name: 'Main 4:4:4 16 Intra', anyLowerBitRate: true },
	{ flags: '11100011', name: 'Main 4:4:4 Still Picture', anyLowerBitRate: true },
	{ flags: '00000011', name: 'Main 4:4:4 16 Still Picture', anyLowerBitRate: true },
];

// multiview format range extensions profiles (general_profile_idc 14), see Table G.2 of Rec. ITU-T H.265 (V11)
// flags are general_max_14bit, max_12bit, max_10bit, max_8bit, max_422chroma, max_420chroma, max_monochrome, intra and
// one_picture_only, and general_lower_bit_rate_constraint_flag shall be 1
const MultiviewFormatRangeExtensionsProfiles = [
	{ flags: '111111100', name: 'Multiview Monochrome' },
	{ flags: '111011100', name: 'Multiview Monochrome 10' },
	{ flags: '110011100', name: 'Multiview Monochrome 12' },
	{ flags: '000011100', name: 'Multiview Monochrome 16' },
];

export function decodeHEVC(val) {
	// the name of the profile with the given general_profile_idc, or null when it is not a known profile
	// profile names according to Annexes A, G, H and I of Rec. ITU-T H.265 (V11)
	function HEVCprofileName(idc, gopocf, gm8bcf) {
		switch (idc) {
			case 1: return { str: 'Main (1)', profile: 'Main' };
			case 2: return { str: `Main 10 ${gopocf ? 'Still Picture ' : ''}(2)`, profile: 'Main 10' };
			case 3: return { str: 'Main Still Picture (3)', profile: 'Main Still' };
			case 4: return formatRangeExtensionsProfile();
			case 5: return { str: 'High Throughput (5)', profile: 'High Throughput' };
			case 6: return { str: `Multiview Main ${gm8bcf ? '' : '10 '}(6)`, profile: gm8bcf ? 'Multiview Main' : 'Multiview Main 10' };
			case 7: return { str: `Scalable Main ${gm8bcf ? '' : '10 '}(7)`, profile: 'Scalable Main' };
			case 8: return { str: '3D Main (8)', profile: '3D Main' };
			case 9: return { str: 'Screen Content Coding (9)', profile: 'Screen Content' };
			case 10: return { str: 'Scalable Format Range Extensions (10)', profile: 'Scalable Format Range Extensions' };
			case 11: return { str: 'High Throughput Screen Content Coding (11)', profile: 'High Throughput Screen Content' };
			case 12: return multiviewExtendedProfile('Multiview Extended', 12, '111110001');
			case 13: return multiviewExtendedProfile('Multiview Extended 10', 13, '110110001');
			case 14: return multiviewFormatRangeExtensionsProfile();
		}
		return null;
	}

	// the profile is given by general_profile_idc. Only when that is not a known profile is the first profile
	// that general_profile_compatibility_flag signals compatibility with used instead
	function HEVCprofile(gopocf, gm8bcf) {
		const profile = HEVCprofileName(general_profile_idc, gopocf, gm8bcf);
		if (profile) return profile;
		for (const idc of compatibleProfiles()) {
			const compatible = HEVCprofileName(idc, gopocf, gm8bcf);
			if (compatible)
				return { ...compatible, note: `general_profile_idc (${general_profile_idc}) is not a known profile, the profile is taken from general_profile_compatibility_flag[ ${idc} ]` };
		}
		return error(`unknown profile (${general_profile_idc})`);
	}

	// identify the format range extensions profile from the constraint flags, see Table A.2 of Rec. ITU-T H.265 (V11)
	function formatRangeExtensionsProfile() {
		const flags = [44, 43, 42, 41, 40, 39, 38, 37].map((bit) => showbit(constraintFlags.bitset(bit))).join(''),
			lowerBitRate = constraintFlags.bitset(36);
		const rext = FormatRangeExtensionsProfiles.find((p) => p.flags == flags && (lowerBitRate || p.anyLowerBitRate));
		if (rext) return { str: `${rext.name} (4)`, profile: rext.name };
		return {
			str: 'Format Range Extensions (4)',
			warning: `the constraint flags (${flags}, general_lower_bit_rate_constraint_flag=${showbit(lowerBitRate)}) do not identify a format range extensions profile in Table A.2`,
		};
	}

	// the values of the given constraint flags as a string of 0 and 1
	const flagString = (bits) => bits.map((bit) => showbit(constraintFlags.bitset(bit))).join('');

	// the Multiview Extended and Multiview Extended 10 profiles require these values of general_max_12bit ... general_one_picture_only
	// and general_lower_bit_rate_constraint_flag, see clause G.11.1.2 of Rec. ITU-T H.265 (V11)
	function multiviewExtendedProfile(name, idc, requiredFlags) {
		const res = { str: `${name} (${idc})`, profile: name };
		const flags = flagString([44, 43, 42, 41, 40, 39, 38, 37, 36]);
		if (flags != requiredFlags)
			res.warning = `the constraint flags (${flags}) do not indicate conformance to the ${name} profile (${requiredFlags}), see clause G.11.1.2`;
		return res;
	}

	// identify the multiview format range extensions profile from the constraint flags, see Table G.2 of Rec. ITU-T H.265 (V11)
	function multiviewFormatRangeExtensionsProfile() {
		const flags = flagString([35, 44, 43, 42, 41, 40, 39, 38, 37]),
			lowerBitRate = constraintFlags.bitset(36);
		const mvrext = lowerBitRate ? MultiviewFormatRangeExtensionsProfiles.find((p) => p.flags == flags) : undefined;
		if (mvrext) return { str: `${mvrext.name} (14)`, profile: mvrext.name };
		return {
			str: 'Multiview Format Range Extensions (14)',
			warning: `the constraint flags (${flags}, general_lower_bit_rate_constraint_flag=${showbit(lowerBitRate)}) do not identify a multiview format range extensions profile in Table G.2`,
		};
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

	// general_profile_compatibility_flag[ j ] is bit j of the hexadecimal value, i.e. general_profile_compatibility_flag[ 31 ] is the
	// most significant bit, see clause E.3 of ISO/IEC 14496-15 and clause 7.4.4 of Rec. ITU-T H.265
	const compatibleProfiles = () => [...Array(32).keys()].filter((j) => bitSet32(general_profile_compatibility_flag, j));

	// true when general_profile_idc is one of the given values, or general_profile_compatibility_flag[ idc ] is set for one of them
	const profileOrCompatible = (...idcs) => idcs.some((idc) => general_profile_idc == idc || bitSet32(general_profile_compatibility_flag, idc));

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
	// the checks above give more specific messages, the regex catches anything else that is not in the clause E.3 format
	if (!expressions.HEVC.regex.test(val)) return [error('Regex mismatch!'), error(expressions.HEVC.format), error(expressions.HEVC.description)];

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

	// the conditions below follow profile_tier_level( ) in clause 7.3.3 of Rec. ITU-T H.265 (V11), which only lists
	// profiles 4 to 11. Profiles 12 and 13 (clause G.11.1.2) and 14 (clause G.11.1.3, with general_max_14bit_constraint_flag)
	// are defined in terms of the same constraint flags, so they are included here too
	if (profileOrCompatible(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14)) {
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

		if (profileOrCompatible(5, 9, 10, 11, 14)) {
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
	if (profile?.note) res.push(info(profile.note));
	if (profile?.warning) res.push(warning(profile.warning));
	const compatible = compatibleProfiles();
	if (compatible.length)
		res.push(info(`compatible profiles: ${compatible.map((j) => `${HEVCcompatibleProfileNames[j] ?? 'reserved'} (${j})`).join(', ')}`));

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
	const res = [];

	// see clause E.4 item 1) of ISO/IEC 14496-15: when the sample entry in a codecs list item is 'lhv1' or 'lhe1',
	// no further data is provided in the same list item (the profile, tier and level are in the lhevcptl MIME parameter)
	const listItem = val.match(/^(?<four_cc>lhv1|lhe1)\.(?<extra>.*)$/);
	if (listItem) res.push(warning(`no further data is permitted after ${listItem.groups.four_cc} (${listItem.groups.extra}), use the lhevcptl MIME parameter`));

	const rx = /lhevcptl="(.*)"/g;
	const arr = rx.exec(val);
	// lhevcptl is a MIME parameter (ISO/IEC 14496-15), so it is not present when only the codecs string is provided
	if (!arr?.[1]) return [...res, info('no LHEVC ProfileTierLevel information')];

	// arr[1] contains the value provided in the lhevcptl mime parameter: BLInternal, ListItem1(, ListItemN)*
	const parts = arr[1].split(',').map((p) => p.trim());
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

	if (parts.length < 2) res.push(error('lhevcptl requires at least one ListItem after BLInternal'));

	for (let i = 1; i < parts.length; i++) {
		// each ListItem is OlsIdx.MaxTid.ProfileTierLevel1(.ProfileTierLevelN)*
		const [olsIdx, maxTid, ...ptlParts] = parts[i].split('.');
		if (!/^\d+$/.test(olsIdx ?? '') || !/^\d+$/.test(maxTid ?? '') || ptlParts.length == 0) {
			res.push(error(`invalid format for ListItem${i} (${parts[i]}), expected OlsIdx.MaxTid.ProfileTierLevel1(.ProfileTierLevelN)*`));
			continue;
		}
		res.push(normal(`ListItem${i}: OlsIdx=${olsIdx}, MaxTid=${maxTid}`));

		const ptls = splitProfileTierLevels(ptlParts);
		if (!ptls) {
			res.push(error(`invalid profile-tier-level sub-strings in ListItem${i} (${ptlParts.join('.')})`));
			continue;
		}
		// a tier and level in the constraint bytes means an earlier sub-string omitted its trailing zero bytes
		if (ptls.some((ptl) => ptl.split('.').slice(3).some((part) => /^[LH]\d+$/i.test(part)))) {
			res.push(error(`invalid profile-tier-level sub-strings in ListItem${i} (${ptlParts.join('.')}), trailing zero bytes can only be omitted for the last one`));
			continue;
		}
		ptls.forEach((ptl, j) => {
			res.push(normal(`ListItem${i} PTL${j + 1}=${ptl}`));
			// each profile-tier-level sub-string is decoded as the single-layer HEVC codecs string (clause E.3)
			// the DVB term is left out, as it would describe the sample entry type used for decoding, not the layer
			res.push(...decodeHEVC(`hvc1.${ptl}`).filter((line) => !line.dvb_term));
		});
	}

	return res;
}

// split the profile-tier-level sub-strings of an lhevcptl ListItem, see clause E.4 item 5) of ISO/IEC 14496-15:
// each is general_profile_idc.general_profile_compatibility_flags.tier and level, then the constraint bytes, and
// omission of trailing bytes that are zero is only allowed for the last sub-string, so all the others have six
// constraint bytes (9 parts). The last one has at least one constraint byte (4 to 9 parts).
// returns null when the parts cannot be split this way
function splitProfileTierLevels(ptlParts) {
	const FULL_PTL = 9,
		MIN_PTL = 4;
	const ptls = [];
	let remaining = ptlParts;
	while (remaining.length > FULL_PTL) {
		ptls.push(remaining.slice(0, FULL_PTL).join('.'));
		remaining = remaining.slice(FULL_PTL);
	}
	if (remaining.length < MIN_PTL) return null;
	ptls.push(remaining.join('.'));
	return ptls;
}

export function registerHEVC(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler(['hev1', 'hvc1', 'hev2', 'hvc2', 'hev3', 'hvc3'], 'HEVC/H.265', decodeHEVC, outputHTML);
	addHandler(['lhv1', 'lhe1'], 'Layered HEVC', decodeHEVCLayerInfo, outputHTML);
}
