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
import { normal, error } from './decode.js';

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

	let res = [];

	switch (parts[0]) {
		case 'dvhe':
			res.push(normal('HEVC-based Dolby Vision codec.'));
			res.push(normal('Parameter sets (VPS, PPS, or SPS) are stored either in the sample entries or as part of the samples, or in both.'));
			break;
		case 'dvh1':
			res.push(normal('HEVC-based Dolby Vision codec.'));
			res.push(normal('Parameter sets (VPS, PPS, or SPS) are stored in the sample entries only.'));
			break;
		case 'dvav':
			res.push(normal('AVC-based Dolby Vision codec.'));
			res.push(normal('Parameter sets (PPS or SPS) are stored either in the sample entries or as part of the samples, or in both.'));
			break;
		case 'dva1':
			res.push(normal('AVC-based Dolby Vision codec.'));
			res.push(normal('Parameter sets (PPS or SPS) are stored either in the sample entries of the video stream or in the parameter set stream, but never in both.'));
			break;
	}

	res.push([5,7,8,9,20].includes(profile)
		? normal(`Bitstream Profile ID: ${parts[1]}`)
		: error(`Unrecognised bitstream_profile_id (${parts[1]})`)
	);

	res.push((level >= 1 && level <=13) 
		? normal(`Level ID: ${parts[2]}`)
		: error(`Unrecognised level_id (${parts[2]})`)
	);

	return res;
}


 export function registerDolbyVision(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);
 
	addHandler(['dvhe', 'dvh1', 'dvav', 'dva1'], 'Dolby Vision stream', decodeDolbyVision, outputHTML);
 }