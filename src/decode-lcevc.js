/**
 * @copyright: Copyright (c) 2024-2026
 * @author: Paul Higgs
 * @file: decode-lcevc.js
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

// see clause 13 (carriage of LCEVC) and annex E.10 (codecs parameter) of ISO/IEC 14496-15:2025 (7th edition)
//     (FDIS is WG03N1072; previously ISO/IEC 14496-15:2022/Amd 1:2023 "Carriage of LCEVC in ISOBMFF")

// LCEVC is ISO/IEC 23094-2:2021
// code points are ISO/IEC 23091-2 and ITU-T H.273 (07/24) [https://www.itu.int/rec/T-REC-H.273-202407-I]

const DEBUGGING = false;

import { error, warning } from './decode.js';
import { dumpJSONHTML } from './formatters.js';
import { bold, BREAK, HTMLsafe, err, warn, cell, dflt } from './markup.js';
import { datatypeIs } from './utils.js';

// profiles according to Annex A.3 of ISO/IEC 23094-2:2021
const LCEVC_profiles = {
	0: 'Main profile',
	1: 'Main 4:4:4 profile',
};

export function decodeLCEVC(val) {
	function printProfile(args) {
		const res = Object.prototype.hasOwnProperty.call(LCEVC_profiles, args.value)
			? LCEVC_profiles[args.value]
			: error(`invalid profile (${args.value}), profiles ${Object.keys(LCEVC_profiles).join(' and ')} are defined`);
		return { value: args.value, description: res };
	}

	function printLevel(args) {
		// according to Annex A.4 of ISO/IEC 23094-2:2021
		const res = (args.value >= 1 && args.value <= 4) ? `Level ${args.value}` : error(`invalid level (${args.value}), levels 1 to 4 are defined`);
		return { value: args.value, description: res };
	}

	function SetKeyValue(values, key, value, expression) {
		if (!expression.test(value)) return error(`invalid value for key=${key} (${value}) /${expression.source}/`);

		const t = values.find((elem) => elem.key == key);
		if (t) {
			if (!t.default) {
				return error(`key ${key} can only be provided once`);
			} else {
				t.value = parseInt(value, 10);
				t.default = false;
			}
		}
		return null;
	}

	const KEY_PROFILE = 'vprf',
		KEY_LEVEL = 'vlev';

	const args = [
		{
			key: KEY_PROFILE,
			label: 'Profile',
			value: 0,
			default: true,
			printFn: printProfile,
		},
		{
			key: KEY_LEVEL,
			label: 'Level',
			value: 4,
			default: true,
			printFn: printLevel,
		},
	];

	const res = [], parts = val.split('.');

	for (let i = 1; i < parts.length; i++) {
		if (parts[i].length == 0) {
			res.push(error(`empty key at position ${i}, keys are separated by a single "."`));
			continue;
		}
		const key = parts[i].substring(0, 4);
		const value = parts[i].substring(4);
		// keys are case sensitive (ISO/IEC 14496-15:2025 annex E.10), only 'vprf' and 'vlev' are defined
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
			default:
				if ([KEY_PROFILE, KEY_LEVEL].includes(key.toLowerCase()))
					res.push(error(`key ${key} is not permitted, keys are case sensitive (use ${key.toLowerCase()})`));
				else res.push(warning(`unrecognised key (${key})`));
				break;
		}
	}

	args.forEach((k) => {
		let xtra = {};
		if (k.printFn) xtra = k.printFn(k);
		else xtra.value = k.value;
		res.push({ ...{ name: `${k.label} (${k.key})`, is_default: k.default }, ...xtra });
	});

	return res;
}

function lcevcHTML(label, messages) {
	// const TABLE_STYLE = '<style>table {border-collapse: collapse;border: 1px solid black;} th, td {text-align: left; padding: 8px;} tr:nth-child(even) {background-color: #f2f2f2;}</style>';
	const TABLE_STYLE =
		'<style>table {border-collapse: collapse;border: none;} th, td {text-align: left; padding: 8px;} ' +
		'tr {border-bottom: 1pt solid black;} </style>';

	let res = '';
	if (label) res += bold(HTMLsafe(label)) + BREAK;
	res += TABLE_STYLE + '<table>';
	messages.forEach((msg) => {
		res += '<tr>';
		if (msg?.name) {
			res += cell(msg.name);
			let desc = '';
			if (msg?.decode) desc = msg.decode;
			else if (msg?.warning) desc = warn(msg.warning);
			else if (msg?.description) {
				switch (datatypeIs(msg.description)) {
					case 'string':
						desc = msg.description;
						break;
					case 'array':
						msg.description.forEach((d) => {
							if (datatypeIs(d, 'string')) desc += d + BREAK;
							else if (datatypeIs(d, 'object')) {
								if (d?.title) desc += bold(d.title);
								if (d?.warning) desc += warn(d.warning);
								else if (d?.label && Object.prototype.hasOwnProperty.call(d, 'value')) {
									desc += d.label + ': ';
									if (datatypeIs(d.value, 'string') || datatypeIs(d.value, 'number')) desc += d.value;
									else if (datatypeIs(d.value, 'object')) {
										if (d.value?.warning) desc += warn(d.value.warning);
									}
								}
								desc += BREAK;
							}
						});
						break;
					case 'object':
						if (msg.description?.error) desc = err(msg.description.error);
						else if (msg.description?.warning) desc = warn(msg.description.warning);
						break;
					default:
						desc = warn('unrecognised description');
						break;
				}
			}
			res += msg.value != null ? cell(msg.value) + cell(desc) : cell(desc, 2);
			res += cell(msg?.is_default ? dflt('default') : '');
		}
		else if (msg?.error) res += cell(err(msg.error), 4);
		else if (msg?.warning) res += cell(warn(msg.warning), 4);
		else res += cell(err(`invalid element ${JSON.stringify(msg)}`), 4);
		res += '</tr>';
	});
	res += '</table>';
	if (DEBUGGING) res += dumpJSONHTML(messages);
	return res;
}

export function registerLCEVC(addHandler) {
	addHandler('lvc1', 'MPEG Low Complexity Enhancement Video Coding', decodeLCEVC, lcevcHTML);
}
