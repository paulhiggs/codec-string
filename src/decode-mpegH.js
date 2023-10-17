/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-mpegH.js
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

// see ISO/IEC 23000-19:2019 Amd.2 "CMAF Media Profiles for MPEG-H 3D Audio, EVC, VVC and other technologies"
// MDS19970_WG03_N00137

import { BREAK, err, bold } from './markup.js';
import { DVBclassification } from './dvb-mapping.js';

export function decodeMPEGH(val) {
	//const MHAregex = /^(mhm1|mhm2)\.0x[a-fA-F\d]{2}$/;
	const parts = val.split('.');

	if (parts.length != 2) return err('MPEG-H audio requires a profile-level-id') + BREAK;

	let res = '';
	const level = parseInt(parts[1], 16),
		coding_params = { type: 'audio', codec: parts[0] };

	switch (level) {
		case 0x0b:
			res += 'LC Profile Level 1';
			coding_params.mode = 'LC';
			coding_params.level = '1';
			break;
		case 0x0c:
			res += 'LC Profile Level 2';
			coding_params.mode = 'LC';
			coding_params.level = '2';
			break;
		case 0x0d:
			res += 'LC Profile Level 3';
			coding_params.mode = 'LC';
			coding_params.level = '3';
			break;
		case 0x10:
			res += 'BL Profile Level 1';
			coding_params.mode = 'BL';
			coding_params.level = '1';
			break;
		case 0x11:
			res += 'BL Profile Level 2';
			coding_params.mode = 'BL';
			coding_params.level = '2';
			break;
		case 0x12:
			res += 'BL Profile Level 3';
			coding_params.mode = 'BL';
			coding_params.level = '3';
			break;
		default:
			return err(`invalid level (${parts[1]})`) + BREAK;
	}
	if (parts[0] == 'mhm2') res += ', multi-steam';
	res += BREAK;

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res += BREAK + bold('DVB term: ') + dvb + BREAK;

	return res;
}

export function registerMPEGH(addHandler) {
	addHandler(['mhm1', 'mhm2'], 'MPEG-H Audio', decodeMPEGH);
}
