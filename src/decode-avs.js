/**
 * @copyright: Copyright (c) 2021-2023
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

/*jshint esversion: 6 */

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

function decodeAVS3(val) {
	let parts = val.split(".");
	if (parts.length != 3) return err("AVS3 codec requires 3 parts") + BREAK;

	let argErrs = "";
	if (!hexDigits(parts[1])) argErrs += err(`profile_id not expressed in hexadecimal (${parts[1]})`) + BREAK;
	if (!hexDigits(parts[2])) argErrs += err(`level_id not expressed in hexadecimal (${parts[2]})`) + BREAK;

	if (argErrs.length) return argErrs;

	let coding_params = { type: "video", codec: parts[0] };

	let profile_id = parseInt(parts[1], 16),
		level_id = parseInt(parts[2], 16);
	let res = "";

	let prof = null;
	switch (profile_id) {
		case avs3.profileMain8:
			prof = "Main 8-bit profile";
			break;
		case avs3.profileMain10:
			prof = "Main 10-bit profile";
			break;
		case avs3.profileHigh8:
			prof = "High 8-bit profile";
			break;
		case avs3.profileHigh10:
			prof = "High 10-bit profile";
			break;
		default:
			coding_params.profile = "invalid";
			res += err(`invalid profile_id (${parts[1]}) specified`);
	}
	if (prof) {
		res += prof;
		coding_params.profile = prof;
	}
	res += BREAK;

	let lev = null;
	switch (level_id) {
		case 0x00:
			res += warn("forbidden");
			break;
		case avs3.level2_0_15:
			lev = "2.0.15";
			break;
		case avs3.level2_0_30:
			lev = "2.0.30";
			break;
		case avs3.level2_0_60:
			lev = "2.0.60";
			break;
		case avs3.level4_0_30:
			lev = "4.0.30";
			break;
		case avs3.level4_0_60:
			lev = "4.0.60";
			break;
		case avs3.level6_0_30:
			lev = "6.0.30";
			break;
		case avs3.level6_2_30:
			lev = "6.2.30";
			break;
		case avs3.level6_4_30:
			lev = "6.4.30";
			break;
		case avs3.level6_6_30:
			lev = "6.6.30";
			break;
		case avs3.level6_0_60:
			lev = "6.0.60";
			break;
		case avs3.level6_2_60:
			lev = "6.2.60";
			break;
		case avs3.level6_4_60:
			lev = "6.4.60";
			break;
		case avs3.level6_6_60:
			lev = "6.6.60";
			break;
		case avs3.level6_0_120:
			lev = "6.0.120";
			break;
		case avs3.level6_2_120:
			lev = "6.2.120";
			break;
		case avs3.level6_4_120:
			lev = "6.4.120";
			break;
		case avs3.level6_6_120:
			lev = "6.6.120";
			break;
		case avs3.level8_0_30:
			lev = "8.0.30";
			break;
		case avs3.level8_2_30:
			lev = "8.2.30";
			break;
		case avs3.level8_4_30:
			lev = "8.4.30";
			break;
		case avs3.level8_6_30:
			lev = "8.6.30";
			break;
		case avs3.level8_0_60:
			lev = "8.0.60";
			break;
		case avs3.level8_2_60:
			lev = "8.2.60";
			break;
		case avs3.level8_4_60:
			lev = "8.4.60";
			break;
		case avs3.level8_6_60:
			lev = "8.6.60";
			break;
		case avs3.level8_0_120:
			lev = "8.0.120";
			break;
		case avs3.level8_2_120:
			lev = "8.2.120";
			break;
		case avs3.level8_4_120:
			lev = "8.4.120";
			break;
		case avs3.level8_6_120:
			lev = "8.6.120";
			break;
		case avs3.level10_0_30:
			lev = "10.0.30";
			break;
		case avs3.level10_2_30:
			lev = "10.2.30";
			break;
		case avs3.level10_4_30:
			lev = "10.4.30";
			break;
		case avs3.level10_6_30:
			lev = "10.6.30";
			break;
		case avs3.level10_0_60:
			lev = "10.0.60";
			break;
		case avs3.level10_2_60:
			lev = "10.2.60";
			break;
		case avs3.level10_4_60:
			lev = "10.4.60";
			break;
		case avs3.level10_6_60:
			lev = "10.6.60";
			break;
		case avs3.level10_0_120:
			lev = "10.0.120";
			break;
		case avs3.level10_2_120:
			lev = "10.2.120";
			break;
		case avs3.level10_4_120:
			lev = "10.4.120";
			break;
		case avs3.level10_6_120:
			lev = "10.6.120";
			break;
		default:
			coding_params.level = "invalid";
			res += err(`invalid level_id (${parts[2]}) specified`);
	}
	if (lev) {
		res += `Level ${lev}`;
		coding_params.level = lev;
	}
	res += BREAK;

	if (res && lev) {
		const foundProfile = avs3allowed.find((entry) => entry.profiles.includes(profile_id));
		if (foundProfile && !foundProfile.levels.includes(level_id)) res += warn(`specified profile (${parts[1]}) does not support the specified level (${parts[2]})`) + BREAK;
	}
	let dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res += BREAK + bold("DVB term: ") + dvb + BREAK;

	return res;
}

addHandler(["avs3"], "AVS3 Video", decodeAVS3);
addHandler(["lav3"], "AVS3 Library Track", decodeAVS3);
