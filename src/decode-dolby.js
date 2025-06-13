/**
 * @copyright: Copyright (c) 2025
 * @author: Paul Higgs
 * @file: decode-dolby.js
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

import { simpleHTML } from './formatters.js';
import { expressions } from './regular_expressions.js';
import { normal, info, error } from './decode.js';

 const DEBUGGING = false;

// See DolbyVisionProfileLevels.pdf - available at https://dolby.my.salesforce.com/sfc/dist/version/download/?oid=00D700000009YuG&ids=068QQ00000bpfevYAA&d=/a/4u000000B3Ig/8qhPH.ETus3SaczpT9twKYXsYUtwstZpjlev3DBll.I&operationContext=DELIVERY&viewId=05HQQ00000ThR5t2AF&dpt=
// and DolbyVisionInMPEGDASHSpecification.pdf - available at https://dolby.my.salesforce.com/sfc/dist/version/download/?oid=00D700000009YuG&ids=0684u00000V1DFXAA3&d=/a/4u000000l6FV/TqYPD0f0c3Zm40JJrFKFn1m29QdUxuVB.U_GzZzbXgE&operationContext=DELIVERY&viewId=05HQQ00000ThX6T2AV&dpt=

export function decodeDolbyVision(val) {
	if (!expressions.DolbyVision.regex.test(val)) return [error('Regex mismatch!'), error(expressions.DolbyVision.format)];
	const parts = val.split('.');
	// this check should not fail as the number of parts and the format are checked in the regular expression
	if (parts.length != 3) return [error(`DolbyVision format is "${expressions.AC4.format}"`)];

	const profile = parseInt(parts[1]),
		level = parseInt(parts[2]);

	let map = [], res = [];

	switch (parts[0]) {
		case 'dvhe':
			res.push(normal('HEVC-based Dolby Vision codec.'));
			res.push(info('Parameter sets (VPS, PPS, or SPS) are stored either in the sample entries or as part of the samples, or in both.'));
			map = [
				{profile: 2, base_codec: "8-bit HEVC", retired: true},
				{profile: 3, base_codec: "8-bit HEVC", retired: true},
				{profile: 4, base_codec: "8-bit HEVC", retired: true},
				{profile: 5, base_codec: "10-bit HEVC"}, 
				{profile: 6, base_codec: "10-bit HEVC", retired: true},
				{profile: 7, base_codec: "10-bit HEVC"}, 
				{profile: 8, base_codec: "10-bit HEVC"},
			] 
			break;
		case 'dvh1':
			res.push(normal('HEVC-based Dolby Vision codec.'));
			res.push(info('Parameter sets (VPS, PPS, or SPS) are stored in the sample entries only.'));
			map = [{profile: 20, base_codec: "10-bit MV-HEVC (for 3D) or HEVC (for 2D)"}];
			break;
		case 'dvav':
			res.push(normal('AVC-based Dolby Vision codec.'));
			res.push(info('Parameter sets (PPS or SPS) are stored either in the sample entries or as part of the samples, or in both.'));
			map = [
				{profile: 0, base_codec: "Advanced Video Coding (AVC)", retired: true},
				{profile: 1, base_codec: "AVC", retired: true},
				{profile: 9, base_codec: "8-bit AVC (High, High Progressive or Conttrained High profile)"},
			];
			break;
		case 'dva1':
			res.push(normal('AVC-based Dolby Vision codec.'));
			res.push(info('Parameter sets (PPS or SPS) are stored either in the sample entries of the video stream or in the parameter set stream, but never in both.'));
			break;
		case 'dav1':
			res.push(normal('AV1-based Dolby Vision codec.'));
			map = [{profile: 10, base_codec: "10-bit AV1"}];
			break;
	}

  const validProfile = [0,1,2,3,4,5,6,7,8,9,10,20].includes(profile);
	res.push(validProfile
		? normal(`Bitstream Profile ID: ${parts[1]}`)
		: error(`Unrecognised bitstream_profile_id (${parts[1]})`)
	);
	const opts = map.find((e) => e.profile = profile);
	if (validProfile)
		res.push(opts 
			? info(`${opts.base_codec}  ${opts.retired ? "  (retired)" : ""}`)
			: error(`invalid profile ${profile} for ${parts[0]}`)
		);

	res.push((level >= 1 && level <=13) 
		? normal(`Level ID: ${parts[2]}`)
		: error(`Unrecognised level_id (${parts[2]})`)
	);

	return res;
}


 export function registerDolbyVision(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);
 
	addHandler(['dvhe', 'dvh1', 'dvav', 'dva1', 'dav1'], 'Dolby Vision stream', decodeDolbyVision, outputHTML);
 }