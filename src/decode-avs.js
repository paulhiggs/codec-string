/**
 * @copyright: Copyright (c) 2021-2024
 * @author: Paul Higgs
 * @file: decode-avs.js
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

import { hexDigits } from './utils.js';
import { normal, warning, error } from './decode.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';
import { expressions } from './regular_expressions.js';

const avs3 = {
	profileMain8: 0x20,
	profileMain10: 0x22,
	profileHigh8: 0x30,
	profileHigh10: 0x32,
	level2_0_15: 0x10,
	level2_0_30: 0x12,
	level2_0_60: 0x14,
	level4_0_30: 0x20,
	level4_0_60: 0x22,
	level6_0_30: 0x40,
	level6_2_30: 0x42,
	level6_4_30: 0x41,
	level6_6_30: 0x43,
	level6_0_60: 0x44,
	level6_2_60: 0x46,
	level6_4_60: 0x45,
	level6_6_60: 0x47,
	level6_0_120: 0x48,
	level6_2_120: 0x4a,
	level6_4_120: 0x49,
	level6_6_120: 0x4b,
	level8_0_30: 0x50,
	level8_2_30: 0x52,
	level8_4_30: 0x51,
	level8_6_30: 0x53,
	level8_0_60: 0x54,
	level8_2_60: 0x56,
	level8_4_60: 0x55,
	level8_6_60: 0x57,
	level8_0_120: 0x58,
	level8_2_120: 0x5a,
	level8_4_120: 0x59,
	level8_6_120: 0x5b,
	level10_0_30: 0x60,
	level10_2_30: 0x62,
	level10_4_30: 0x61,
	level10_6_30: 0x63,
	level10_0_60: 0x64,
	level10_2_60: 0x66,
	level10_4_60: 0x65,
	level10_6_60: 0x67,
	level10_0_120: 0x68,
	level10_2_120: 0x6a,
	level10_4_120: 0x69,
	level10_6_120: 0x6b,
};

const avs3allowed = [
	{
		profiles: [avs3.profileMain8, avs3.profileMain10],
		levels: [
			avs3.level2_0_15,
			avs3.level2_0_30,
			avs3.level2_0_60,
			avs3.level4_0_30,
			avs3.level4_0_60,
			avs3.level6_0_30,
			avs3.level6_2_30,
			avs3.level6_0_60,
			avs3.level6_2_60,
			avs3.level6_0_120,
			avs3.level6_2_120,
			avs3.level8_0_30,
			avs3.level8_2_30,
			avs3.level8_0_60,
			avs3.level8_2_60,
			avs3.level8_0_120,
			avs3.level8_2_120,
			avs3.level10_0_30,
			avs3.level10_2_30,
			avs3.level10_0_60,
			avs3.level10_2_60,
			avs3.level10_0_120,
			avs3.level10_2_120,
		],
	},

	{
		profiles: [avs3.profileHigh8, avs3.profileHish10],
		levels: [
			avs3.level2_0_15,
			avs3.level2_0_30,
			avs3.level2_0_60,
			avs3.level4_0_30,
			avs3.level4_0_60,
			avs3.level6_0_30,
			avs3.level6_2_30,
			avs3.level6_4_30,
			avs3.level6_6_30,
			avs3.level6_0_60,
			avs3.level6_2_60,
			avs3.level6_4_60,
			avs3.level6_6_60,
			avs3.level6_0_120,
			avs3.level6_2_120,
			avs3.level6_4_120,
			avs3.level6_6_120,
			avs3.level8_0_30,
			avs3.level8_2_30,
			avs3.level8_4_30,
			avs3.level8_6_30,
			avs3.level8_0_60,
			avs3.level8_2_60,
			avs3.level8_4_60,
			avs3.level8_6_60,
			avs3.level8_0_120,
			avs3.level8_2_120,
			avs3.level8_4_120,
			avs3.level8_6_120,
			avs3.level10_0_30,
			avs3.level10_2_30,
			avs3.level10_4_30,
			avs3.level10_6_30,
			avs3.level10_0_60,
			avs3.level10_2_60,
			avs3.level10_4_60,
			avs3.level10_6_60,
			avs3.level10_0_120,
			avs3.level10_2_120,
			avs3.level10_4_120,
			avs3.level10_6_120,
		],
	},
];

const AVS3profiles = [
	{ val: avs3.profileMain8, str: 'Main 8-bit profile' },
	{ val: avs3.profileMain10, str: 'Main 10-bit profile' },
	{ val: avs3.profileHigh8, str: 'High 8-bit profile' },
	{ val: avs3.profileHigh10, str: 'High 10-bit profile' },
];

const AVS3ProfileStr = (prof) => {
	const t = AVS3profiles.find((e) => (e.val == prof));
	return t ? `${t.str} (${prof})` : null;
};

const AVS3levels = [
	{ val: avs3.level2_0_15, str: '2.0.15' },
	{ val: avs3.level2_0_30, str: '2.0.30' },
	{ val: avs3.level2_0_60, str: '2.0.60' },
	{ val: avs3.level4_0_30, str: '4.0.30' },
	{ val: avs3.level4_0_60, str: '4.0.60' },
	{ val: avs3.level6_0_30, str: '6.0.30' },
	{ val: avs3.level6_2_30, str: '6.2.30' },
	{ val: avs3.level6_4_30, str: '6.4.30' },
	{ val: avs3.level6_6_30, str: '6.6.30' },
	{ val: avs3.level6_0_60, str: '6.0.60' },
	{ val: avs3.level6_2_60, str: '6.2.60' },
	{ val: avs3.level6_4_60, str: '6.4.60' },
	{ val: avs3.level6_6_60, str: '6.6.60' },
	{ val: avs3.level6_0_120, str: '6.0.120' },
	{ val: avs3.level6_2_120, str: '6.2.120' },
	{ val: avs3.level6_4_120, str: '6.4.120' },
	{ val: avs3.level6_6_120, str: '6.6.120' },
	{ val: avs3.level8_0_30, str: '8.0.30' },
	{ val: avs3.level8_2_30, str: '8.2.30' },
	{ val: avs3.level8_4_30, str: '8.4.30' },
	{ val: avs3.level8_6_30, str: '8.6.30' },
	{ val: avs3.level8_0_60, str: '8.0.60' },
	{ val: avs3.level8_2_60, str: '8.2.60' },
	{ val: avs3.level8_4_60, str: '8.4.60' },
	{ val: avs3.level8_6_60, str: '8.6.60' },
	{ val: avs3.level8_0_120, str: '8.0.120' },
	{ val: avs3.level8_2_120, str: '8.2.120' },
	{ val: avs3.level8_4_120, str: '8.4.120' },
	{ val: avs3.level8_6_120, str: '8.6.120' },
	{ val: avs3.level8_0_30, str: '10.0.30' },
	{ val: avs3.level10_2_30, str: '10.2.30' },
	{ val: avs3.level10_4_30, str: '10.4.30' },
	{ val: avs3.level10_6_30, str: '10.6.30' },
	{ val: avs3.level10_0_60, str: '10.0.60' },
	{ val: avs3.level10_2_60, str: '10.2.60' },
	{ val: avs3.level10_4_60, str: '10.4.60' },
	{ val: avs3.level10_6_60, str: '10.6.60' },
	{ val: avs3.level10_0_120, str: '10.0.120' },
	{ val: avs3.level10_2_120, str: '10.2.120' },
	{ val: avs3.level10_4_120, str: '10.4.120' },
	{ val: avs3.level10_6_120, str: '10.6.120' },
];
const AVS3LevelStr = (lev) => {
	const t = AVS3levels.find((e) => (e.val == lev));
	return t ? `${t.str} (${lev})` : null;
};

export function decodeAVS3(val) {
	if (!expressions.AVS3video.regex.test(val))
		return [error('Regex mismatch!'), error(expressions.AVS3video.format), error(expressions.AVS3video.description)];

	const parts = val.split('.');
	// the following check should not occur due to regular expression checking
	if (parts.length != 3) return [error('AVS3 codec requires 3 parts')];

	const argErrs = [];
	// the following checks should not occur due to regular expression checking
	if (!hexDigits(parts[1])) argErrs.push(error(`profile_id not expressed in hexadecimal (${parts[1]})`));
	if (!hexDigits(parts[2])) argErrs.push(error(`level_id not expressed in hexadecimal (${parts[2]})`));
	if (argErrs.length) return argErrs;

	const coding_params = { type: 'video', codec: parts[0] };
	const res = [];
	const profile_id = parseInt(parts[1], 16),
		level_id = parseInt(parts[2], 16);
	const prof = AVS3ProfileStr(profile_id),
		lev = AVS3LevelStr(level_id);
	if (prof) {
		res.push(normal(prof));
		coding_params.profile = prof;
	} else {
		res.push(error(`invalid profile_id (${parts[1]}) specified`));
		coding_params.profile = 'invalid';
	}

	if (level_id == 0x00) res.push(warning('level is forbidden'));
	else if (lev) {
		res.push(normal(`Level ${lev}`));
		coding_params.level = lev;
	} else {
		res.push(error(`invalid level_id (${parts[2]}) specified`));
		coding_params.level = 'invalid';
	}

	if (res && lev) {
		const foundProfile = avs3allowed.find((entry) => entry.profiles.includes(profile_id));
		if (foundProfile && !foundProfile.levels.includes(level_id))
			res.push(warning(`specified profile (${parts[1]}) does not support the specified level (${parts[2]})`));
	}

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function decodeAVS3audio(val) {

	if (!expressions.AVS3audio.regex.test(val)) 
		return [error('Regex mismatch!'), error(expressions.AVS3audio.format), error(expressions.AVS3audio.description)];

	const parts = val.split('.');

	// the following checks should not occur due to regular expression checking
	if (parts.length != 2) return [error('AVS3 audio codec requires 2 parts')];
	if (!hexDigits(parts[1])) return [error(`audio_codec_id not expressed in hexadecimal (${parts[1]})`)];

	const coding_params = { type: 'audio', codec: parts[0] };
	const res = [];
	const audio_codec_id = parseInt(parts[1], 16);

	switch (audio_codec_id) {
		case 0:
			res.push(normal('General Audio Coding'));
			break;
		case 1:
			res.push(normal('Lossless Audio Coding'));
			coding_params.codec_id='1';
			break;
		case 2:
			res.push(normal('Full Rate Audio Coding'));
			coding_params.codec_id='2';
			break;
		default:
			res.push(error(`invalid audio_codec_id (${parts[1]}) specified`));
			break;
	}

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function decodeAVS2audio(val) {
	if (!expressions.AVS2audio.regex.test(val)) 
		return [error('Regex mismatch!'), error(expressions.AVS2audio.format), error(expressions.AVS2audio.description)];

	const parts = val.split('.');

	// the following checks should not occur due to regular expression checking
	if (parts.length != 2) return [error('AVS2 audio codec requires 2 parts')];
	if (!hexDigits(parts[1])) return [error(`audio_codec_id not expressed in hexadecimal (${parts[1]})`)];

	const coding_params = { type: 'audio', codec: parts[0] };
	const res = [];
	const audio_codec_id = parseInt(parts[1], 16);

	switch (audio_codec_id) {
		case 0:
			res.push(normal('General Audio Coding'));
			break;
		case 1:
			res.push(normal('Lossless Audio Coding'));
			break;
		default:
			res.push(error(`invalid audio_codec_id (${parts[1]}) specified`));
			break;
	}

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function registerAVS3(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler('avs3', 'AVS3 Video', decodeAVS3, outputHTML);
	addHandler('lav3', 'AVS3 Library Track', decodeAVS3, outputHTML);
	addHandler('av3a', 'AVS3 Audio', decodeAVS3audio, outputHTML);
	addHandler('cavs', 'AVS2 Audio', decodeAVS2audio, outputHTML);
}
