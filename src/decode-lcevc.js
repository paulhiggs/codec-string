/**
 * @copyright: Copyright (c) 2024
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

// see ISO/IEC 14496-15:2022 Amd.1 "Carriage of LCEVC in ISOBMFF" (w19454)
// and ISO/IEC 23091-2 (MDS19669_WG05_N00011)

const DEBUGGING = false;

import { error, warning } from './decode.js';
import { dumpJSONHTML } from './formatters.js';
import { bold, BREAK, HTMLsafe, err, warn, cell, dflt } from './markup.js';
import { datatypeIs } from './utils.js';

export function decodeLCEVC(val) {

	function printProfile(args) {
		// accprding to Annex A.3 of ISO/IEC 23094-2 (FDIS is MDS19801_WG04_N00025)
		let res = null;
		switch (args.value) {
			case 0:
				res = 'Main profile';
				break;
			case 1:
				res = 'Main 4:4:4 profile';
				break;
			default:
				res = error('invalid');
				break;
		}
		return { value: args.value, description: res };
	}

	function printLevel(args) {
		// accprding to Annex A.4 of ISO/IEC 23094-2 (FDIS is MDS19801_WG04_N00025)
		let res = null;
		if (args.value >= 1 && args.value <=4)
			res = `Level ${args.value}`;
		else res = error('invalid');
		return { value: args.value, description: res };
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
		const key = parts[i].substring(0, 4);
		const value = parts[i].substring(4);
		switch (key.toLowerCase()) {
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
				res.push(warning('unrecognised key  (' + key + ')'));
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
	addHandler('lvc1', 'MPEG Low Complexidy Enhancement Video Coding', decodeLCEVC, lcevcHTML);
}
