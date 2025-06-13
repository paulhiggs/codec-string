/**
 * @copyright: Copyright (c) 2021-2024
 * @author: Paul Higgs
 * @file: decode.js
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

import { LINE } from './markup.js';
import { findHandler } from './handler.js';
import { err } from './markup.js';

export const normal = (str) => ({ decode: str });
export const warning = (str) => ({ warning: str });
export const info = (str) => ({ informative: str});
export const error = (str) => ({ error: str });
export const title = (str) => ({ title: str });

class general_parsing {
	constructor() {
		this.decodes = [];
	}

	general_error(error) {
		this.error = error;
	}

	push(decode) {
		this.decodes.push(decode);
	}

	toHTML() {
		let res = '';
		this.decodes.forEach((parsing) => {
			if (res.length) res += LINE;
			res += parsing.toHTML();
		});
		return res;
	}
}

class parsing {
	constructor() {
		this.label = 'unset';
		this.parsed = null;
	}

	generalError(error) {
		this.error = error;
	}

	setLabel(label) {
		this.label = label;
	}

	setHTMLPrinter(printFn) {
		this.HTMLPrinter = printFn;
	}

	setResult(result) {
		if (Array.isArray(result)) this.parsed = result;
		else if (typeof result == 'string') this.parsed = [].push(result);
		else this.parsed = [error('failed to interpret decoding result')];
	}

	toHTML() {
		if (this?.error) return err(this.error);
		if (!this?.HTMLPrinter) return err('no HTML output function specified');
		return this.HTMLPrinter(this?.label, this?.parsed);
	}
}

export function decode(val) {
	const codecs = val.split(',');
	const res = new general_parsing();

	codecs.forEach((component) => {
		component = component.replace(/\s/gm, '');
		const codec = component.indexOf('.') == -1 ? component : component.substr(0, component.indexOf('.'));
		const handler = findHandler(codec),
			res2 = new parsing();
		if (handler) {
			res2.setLabel(handler.label);
			res2.setHTMLPrinter(handler.html_outputter);
			res2.setResult(handler.func(component));
		} else res2.generalError(`unsupported codec=${codec}`);
		res.push(res2);
	});
	return res;
}
