/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-avc.js
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
/**
 * https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html
 * https://en.wikipedia.org/wiki/Advanced_Video_Coding
 **/

import { BREAK, err, bold } from './markup.js';
import { hexDigits } from './hexDigits.js';
import { sscanf } from './sscanf-func.js';
import { DVBclassification } from './dvb-mapping.js';

export function decodeAVC(val) {
	// regex from DVB TM-STREAM0087:  /avc[1-4]\.[a-fA-F\d]{6}/

	function AVCconstraint(val, constraint) {
		// constraint 012345--
		// bit        76543210
		if (constraint < 0 || constraint > 5) return false;
		return val & Math.pow(2, 7 - constraint) ? true : false;
	}

	const coding_params = { type: 'video', codec: parts[0] };
	const parts = val.split('.');
	let res = '';

	if (parts.length != 2) return err('invalid format') + BREAK;

	if (parts[1].length != 6) return err(`invalid parameters length (${parts[1].length}) - should be 6`) + BREAK;

	if (!hexDigits(parts[1])) return err('parameters contains non-hex digits') + BREAK;

	const prof = sscanf(parts[1], '%2x%2x%2x');
	res += `profile_idc=${prof[0]} constraint_set=${prof[1]} level_idc=${prof[2]}${BREAK}`;

	res += 'profile=';
	let profile = '';
	switch (prof[0]) {
		case 0x2c:
			profile = 'CAVLC 4:4:4';
			break;
		case 0x42:
			profile = `${AVCconstraint(prof[1], 1) ? 'Constrained ' : ''}Baseline`;
			break;
		case 0x4d:
			profile = `${AVCconstraint(prof[1], 1) ? 'Constrained ' : ''}Main`;
			break;
		case 0x53:
			profile = `Scalable ${AVCconstraint(prof[1], 5) ? 'Constrained ' : ''}Base`;
			break;
		case 0x56:
			profile = 'Scalable ';
			if (!AVCconstraint(prof[1], 3) && AVCconstraint(prof[1], 5)) profile += 'Constrained ';
			if (AVCconstraint(prof[1], 3) && !AVCconstraint(prof[1], 5)) profile += 'Intra ';
			profile += 'High';
			break;
		case 0x58:
			profile = 'Extended';
			break;
		case 0x63:
			profile = `High 10${AVCconstraint(prof[1], 3) ? ' Intra' : ''}`;
			break;
		case 0x64:
			if (AVCconstraint(prof[1], 4) && !AVCconstraint(prof[1], 5)) profile += 'Progressive ';
			if (!AVCconstraint(prof[1], 4) && AVCconstraint(prof[1], 5)) profile += 'Constrained ';
			profile += 'High';
			break;
		case 0x76:
			profile = 'Multiview High';
			break;
		case 0x7a:
			profile = `High 4:2:2${AVCconstraint(prof[1], 3) ? ' Intra' : ''}`;
			break;
		case 0x80:
			profile = 'Stereo High';
			break;
		case 0x86:
			profile = 'MFC High';
			break;
		case 0x87:
			profile = 'MFC Depth High';
			break;
		case 0x8a:
			profile = 'Multiview Depth High High';
			break;
		case 0x8b:
			profile = 'Enhanced Multiview Depth High High';
			break;
		case 0xf4:
			profile = `High 4:4:4${AVCconstraint(prof[1], 3) ? ' Intra' : ' Predictive'}`;
			break;
		default:
			profile = err('unknown');
	}
	res += `${profile} (${prof[0].toString(16)})${BREAK}`;
	coding_params.profile = profile;

	res += 'constraints=';
	for (let i = 0; i <= 5; i++) res += AVCconstraint(prof[1], i) ? i : '-';
	res += BREAK;

	res += 'level=';
	let level = '';
	switch (prof[2]) {
		case 0x0a:
			level = '1';
			break;
		case 0x0b:
			level = AVCconstraint(prof[1], 3) ? '1b' : '1.1';
			break;
		case 0x0c:
			level = '1.2';
			break;
		case 0x1d:
			level = '1.3';
			break;
		case 0x14:
			level = '2';
			break;
		case 0x15:
			level = '2.1';
			break;
		case 0x16:
			level = '2.2';
			break;
		case 0x1e:
			level = '3';
			break;
		case 0x1f:
			level = '3.1';
			break;
		case 0x20:
			level = '3.2';
			break;
		case 0x28:
			level = '4';
			break;
		case 0x29:
			level = '4.1';
			break;
		case 0x2a:
			level = '4.2';
			break;
		case 0x32:
			level = '5';
			break;
		case 0x33:
			level = '5.1';
			break;
		case 0x34:
			level = '5.2';
			break;
		case 0x3c:
			level = '6';
			break;
		case 0x3d:
			level = '6.1';
			break;
		case 0x3f:
			level = '6.2';
			break;
		default:
			level = err('undefined');
	}
	coding_params.level = level;
	res += `${level} (${prof[2].toString(16)})${BREAK}`;

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res += BREAK + bold('DVB term: ') + dvb + BREAK;

	return res + BREAK;
}

export function registerAVC(addHandler) {
	addHandler(['avc1', 'avc2', 'avc3', 'avc4'], 'AVC/H.264', decodeAVC);
	addHandler(['mvc1', 'mvc2'], 'Multiview Coding', decodeAVC);
	addHandler('svc1', 'Scalable Video Coding', decodeAVC);
}
