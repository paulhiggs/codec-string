/**
 * @copyright: Copyright (c) 2021-2026
 * @author: Paul Higgs
 * @file: decode-evc.js
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

// see annex E.9 of  ISO/IEC 14496-15:2022  "Carriage of network abstraction layer (NAL) unit structured video in the ISO base media file format"

const DEBUGGING = false;

import { bitSet32 } from './bits.js';
import { error, warning } from './decode.js';
import { BREAK, HTMLsafe, err, warn, cell, dflt } from './markup.js';
import { keyValueHTML } from './formatters.js';

export function decodeEVC(val) {
	const BASELINE_PROFILE = 0,
		MAIN_PROFILE = 1,
		BASELINE_STILL_PROFILE = 2,
		MAIN_STILL_PROFILE = 3;
	const ProfileNames = ['Baseline profile', 'Main profile', 'Baseline Still Picture profile', 'Main Still Picture profile'];

	const showbit = (v) => v ? '1' : '0';

	function printProfile(args) {
		// according to Annex A.3 of ISO/IEC 23094-1 (FDIS is w19229)
		let res;
		switch (args.value) {
			case BASELINE_PROFILE:
			case MAIN_PROFILE:
			case BASELINE_STILL_PROFILE:
			case MAIN_STILL_PROFILE:
				res = ProfileNames[args.value];
				break;
			default:
				res = error('invalid');
				break;
		}
		return { value: args.value, description: res };
	}

	// according to Annex A.4 of ISO/IEC 23094-1 (FDIS is w19229)
	const Levels = {
		10: 'Level 1',
		20: 'Level 2',
		21: 'Level 2.1',
		30: 'Level 3',
		31: 'Level 3.1',
		40: 'Level 4',
		41: 'Level 4.1',
		50: 'Level 5',
		51: 'Level 5.1',
		52: 'Level 5.2',
		60: 'Level 6',
		61: 'Level 6.1',
		62: 'Level 6.2',
	};

	function printLevel(args) {
		return { value: args.value, description: Levels[args.value] ?? error('invalid') };
	}

	const evaluate = (highBit, lowBit, profile_idc) =>
		(profile_idc == BASELINE_PROFILE && highBit | lowBit) ? ` --> must be 0 for ${ProfileNames[BASELINE_PROFILE]}` : null;

	function analyseToolset(toolset_idc_h, toolset_idc_l, profile_idc) {
		const res = [];
		toolset.forEach((t) => {
			res.push({
				tool: t.tool,
				description: `[h:${showbit(bitSet32(toolset_idc_h, t.bit))} l:${showbit(bitSet32(toolset_idc_l, t.bit))}]`,
				error: evaluate(bitSet32(toolset_idc_h, t.bit), bitSet32(toolset_idc_l, t.bit), profile_idc),
			});
		});
		return res;
	}

	function printToolset(values) {
		const h = values.find((v) => v.key == KEY_TOOLSET_HIGH);
		const l = values.find((v) => v.key == KEY_TOOLSET_LOW);
		const p = values.find((v) => v.key == KEY_PROFILE);

		if (!h || !l || !p) return [error("can't decode toolset")];

		const res = [];
		res.push({ toolset: { key: h.key, label: h.label, value: h.value, description: analyseToolset(h.value, l.value, p.value), is_default: h.default } });
		res.push({ toolset: { key: l.key, label: l.label, value: l.value, description: null, is_default: l.default } });
		return res;
	}

	function SetKeyValue(values, key, value, expression, hexadecimal = false) {
		if (!expression.test(value)) return error(`invalid value for key=${key} (${value}) /${expression.source}/`);

		const t = values.find((elem) => elem.key == key);
		if (t) {
			if (!t.default) {
				return error(`key ${key} can only be provided once`);
			} else {
				t.value = parseInt(value, hexadecimal ? 16 : 10);
				t.default = false;
			}
		}
		return null;
	}

	const KEY_PROFILE = 'vprf',
		KEY_LEVEL = 'vlev',
		KEY_TOOLSET_HIGH = 'vtoh',
		KEY_TOOLSET_LOW = 'vtol';

	const toolset = [
		{ bit: 0, tool: 'sps_btt_flag' },
		{ bit: 1, tool: 'sps_suco_flag' },
		{ bit: 2, tool: 'sps_amvr_flag' },
		{ bit: 3, tool: 'sps_mmvd_flag' },
		{ bit: 4, tool: 'sps_affine_flag' },
		{ bit: 5, tool: 'sps_dmvr_flag' },
		{ bit: 6, tool: 'sps_alf_flag' },
		{ bit: 7, tool: 'sps_admvp_flag' },
		{ bit: 8, tool: 'sps_eipd_flag' },
		{ bit: 9, tool: 'sps_adcc_flag' },
		{ bit: 10, tool: 'sps_ibc_flag' },
		{ bit: 11, tool: 'sps_iqt_flag' },
		{ bit: 12, tool: 'sps_htdf_flag' },
		{ bit: 13, tool: 'sps_addb_flag' },
		{ bit: 14, tool: 'sps_cm_init_flag' },
		{ bit: 15, tool: 'sps_ats_flag' },
		{ bit: 16, tool: 'sps_rpl_flag' },
		{ bit: 17, tool: 'sps_pocs_flag' },
		{ bit: 18, tool: 'sps_dquant_flag' },
		{ bit: 19, tool: 'sps_dra_flag' },
		{ bit: 20, tool: 'sps_hmvp_flag' },
	];

	const args = [
		{
			key: KEY_PROFILE,
			label: 'Profile',
			value: 1,
			default: true,
			printFn: printProfile,
		},
		{
			key: KEY_LEVEL,
			label: 'Level',
			value: 51,
			default: true,
			printFn: printLevel,
		},
		{
			key: KEY_TOOLSET_HIGH,
			label: 'Toolset High',
			value: 0x1fffff,
			default: true,
			deferredPrint: true,
		},
		{
			key: KEY_TOOLSET_LOW,
			label: 'Toolset Low',
			value: 0x000000,
			default: true,
			deferredPrint: true,
		},
	];

	const res = [], parts = val.split('.');

	for (let i = 1; i < parts.length; i++) {
		const key = parts[i].substring(0, 4).toLowerCase();
		const value = parts[i].substring(4);
		switch (key) {
			case KEY_PROFILE: {
				const ProfileRegex = /^\d+$/;
				const k = SetKeyValue(args, key, value, ProfileRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_LEVEL: {
				const LevelRegex = /^\d+$/;
				const k = SetKeyValue(args, key, value, LevelRegex);
				if (k) res.push(k);
				break;
			}
			case KEY_TOOLSET_HIGH: {
				const ToolsetHighRegex = /^[a-f\d]{6}$/i;
				const k = SetKeyValue(args, key, value, ToolsetHighRegex, true);
				if (k) res.push(k);
				break;
			}
			case KEY_TOOLSET_LOW: {
				const ToolsetLowRegex = /^[a-f\d]{6}$/i;
				const k = SetKeyValue(args, key, value, ToolsetLowRegex, true);
				if (k) res.push(k);
				break;
			}
			default:
				res.push(warning('unrecognised key (' + key + ')'));
				break;
		}
	}

	args.forEach((k) => {
		if (!k?.deferredPrint) {
			let xtra = {};
			if (k.printFn) xtra = k.printFn(k);
			else xtra.value = k.value;
			res.push({ ...{ name: `${k.label} (${k.key})`, is_default: k.default }, ...xtra });
		}
	});
	res.push(...printToolset(args));

	return res;
}

function evcHTML(label, messages) {
	function printHex3(value) {
		let enc = value.toString(16);
		while (enc.length < 6) enc = '0' + enc;
		return `0x${enc}`;
	}

	// toolset rows are specific to EVC, other rows use the common key/value rendering
	function toolsetRow(msg) {
		if (msg?.name || !msg?.toolset) return null;
		const toolset = msg.toolset;
		let res = cell(`${toolset.label} (${toolset.key})`);
		res += cell(toolset.value != null ? printHex3(toolset.value) : warn('novalue'));
		let tools = '';
		if (toolset.description)
			toolset.description.forEach((d) => {
				tools += d.tool + ' ' + d.description + (d.error ? ` ${err(HTMLsafe(d.error))}` : '') + BREAK;
			});
		if (tools.length) res += cell(tools, 1, 2);
		res += cell(toolset?.is_default ? dflt('default') : '');
		return res;
	}

	return keyValueHTML(label, messages, toolsetRow, { zebra: true, debugging: DEBUGGING });
}

export function registerEVC(addHandler) {
	addHandler('evc1', 'MPEG Essential Video Coding', decodeEVC, evcHTML);
}
