/**
 * @copyright: Copyright (c) 2021-2026
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

/**
 * https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html
 * https://en.wikipedia.org/wiki/Advanced_Video_Coding
 **/
const DEBUGGING = false;

import { normal, error } from './decode.js';
import { DVBclassification } from './dvb-mapping.js';
import { simpleHTML } from './formatters.js';
import { expressions } from './regular_expressions.js';

/**
 * AVCregex
 * 4 ASCII Printable characters (see https://en.wikipedia.org/wiki/FourCC)
 * followed by a period and then 6 hexadecimal characters
 */


export function decodeAVC(val) {
	
	// constraint 012345--
	// bit        76543210
	const AVCconstraint = (val, constraint) => (constraint >= 0 && constraint <= 5) && (val & Math.pow(2, 7 - constraint));

	if (!expressions.AVC.regex.test(val)) 
		return [error('Regex mismatch!'), error(`${val.substring(0,4)}.${expressions.AVC.format_suffix}`), error(expressions.AV1.description)];

	const result = val.match(expressions.AVC.regex_grouped);
	if (!result || !result.groups) return [error('Regex mismatch!!'), error(`${val.substring(0,4)}.${expressions.AVC.format_suffix}`), error(expressions.AV1.description)];

	const profile = parseInt(result.groups.profile, 16),
		constraints = parseInt(result.groups.constraint, 16),
		level = parseInt(result.groups.level, 16),
		coding_params = { type: 'video', codec: result.groups.four_cc },
		res = [];

	res.push(normal(`profile_idc=${profile} constraint_set=${constraints} level_idc=${level}`));

	let profile_str = '';
	switch (profile) {
		case 0x2c:
			profile_str = 'CAVLC 4:4:4';
			break;
		case 0x42:
			profile_str = `${AVCconstraint(constraints, 1) ? 'Constrained ' : ''}Baseline`;
			break;
		case 0x4d:
			profile_str = `${AVCconstraint(constraints, 1) ? 'Constrained ' : ''}Main`;
			break;
		case 0x53:
			profile_str = `Scalable ${AVCconstraint(constraints, 5) ? 'Constrained ' : ''}Base`;
			break;
		case 0x56:
			profile_str = 'Scalable ';
			if (!AVCconstraint(constraints, 3) && AVCconstraint(constraints, 5)) profile_str += 'Constrained ';
			if (AVCconstraint(constraints, 3) && !AVCconstraint(constraints, 5)) profile_str += 'Intra ';
			profile_str += 'High';
			break;
		case 0x58:
			profile_str = 'Extended';
			break;
		case 0x63:
			profile_str = `High 10${AVCconstraint(constraints, 3) ? ' Intra' : ''}`;
			break;
		case 0x64:
			if (AVCconstraint(constraints, 4) && !AVCconstraint(constraints, 5)) profile_str += 'Progressive ';
			if (!AVCconstraint(constraints, 4) && AVCconstraint(constraints, 5)) profile_str += 'Constrained ';
			profile_str += 'High';
			break;
		case 0x76:
			profile_str = 'Multiview High';
			break;
		case 0x7a:
			profile_str = `High 4:2:2${AVCconstraint(constraints, 3) ? ' Intra' : ''}`;
			break;
		case 0x80:
			profile_str = 'Stereo High';
			break;
		case 0x86:
			profile_str = 'MFC High';
			break;
		case 0x87:
			profile_str = 'MFC Depth High';
			break;
		case 0x8a:
			profile_str = 'Multiview Depth High High';
			break;
		case 0x8b:
			profile_str = 'Enhanced Multiview Depth High High';
			break;
		case 0xf4:
			profile_str = `High 4:4:4${AVCconstraint(constraints, 3) ? ' Intra' : ' Predictive'}`;
			break;
		default:
			coding_params.profile = 'unknown';
			res.push(error(`unknown profile (${profile})`));
	}
	if (profile_str.length) {
		res.push(normal(`profile=${profile_str} (${profile.toString(16)})`));
		coding_params.profile = profile_str;
	}
	let consts = 'constraints=';
	for (let i = 0; i <= 5; i++) consts += AVCconstraint(constraints, i) ? i : '-';
	res.push(normal(consts));

	let level_str = '';
	switch (level) {
		case 0x0a:
			level_str = '1';
			break;
		case 0x0b:
			level_str = AVCconstraint(constraints, 3) ? '1b' : '1.1';
			break;
		case 0x0c:
			level_str = '1.2';
			break;
		case 0x1d:
			level_str = '1.3';
			break;
		case 0x14:
			level_str = '2';
			break;
		case 0x15:
			level_str = '2.1';
			break;
		case 0x16:
			level_str = '2.2';
			break;
		case 0x1e:
			level_str = '3';
			break;
		case 0x1f:
			level_str = '3.1';
			break;
		case 0x20:
			level_str = '3.2';
			break;
		case 0x28:
			level_str = '4';
			break;
		case 0x29:
			level_str = '4.1';
			break;
		case 0x2a:
			level_str = '4.2';
			break;
		case 0x32:
			level_str = '5';
			break;
		case 0x33:
			level_str = '5.1';
			break;
		case 0x34:
			level_str = '5.2';
			break;
		case 0x3c:
			level_str = '6';
			break;
		case 0x3d:
			level_str = '6.1';
			break;
		case 0x3f:
			level_str = '6.2';
			break;
		default:
			coding_params.level = 'undefined';
			res.push(error(`level=undefined (${level})`));
	}

	if (level_str.length) {
		coding_params.level = level_str;
		res.push(normal(`level=${level_str} (${level.toString(16)})`));
	}

	const dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res.push({ dvb_term: dvb });

	return res;
}

export function registerAVC(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler(['avc1', 'avc2', 'avc3', 'avc4'], 'AVC/H.264', decodeAVC, outputHTML);
	addHandler(['mvc1', 'mvc2'], 'Multiview Coding', decodeAVC, outputHTML);
	addHandler('svc1', 'Scalable Video Coding', decodeAVC, outputHTML);
}
