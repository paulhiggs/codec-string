import { registerAC4 } from './decode-ac4.js';
import { registerAV1 } from './decode-av1.js';
import { registerAVC } from './decode-avc.js';
import { registerAVS3 } from './decode-avs.js';
import { registerDTS } from './decode-dts.js';
import { registerEVC } from './decode-evc.js';
import { registerHEVC } from './decode-hevc.js';
import { registerLCEVC } from './decode-lcevc.js';
import { registerMisc } from './decode-misc.js';
import { registerMPEG } from './decode-mpeg.js';
import { registerMPEGH } from './decode-mpegH.js';
import { registerText } from './decode-text.js';
import { registerVC1 } from './decode-vc1.js';
import { registerVP9 } from './decode-vp9.js';
import { registerVVC } from './decode-vvc.js';

import { datatypeIs } from './utils.js';

const handlers = [];

export const findHandler = (codec) => handlers.find((h) => h.cccc == codec);


function addHandler(FourCC, Label, Handler, HTMLPrinter) {
	if (Handler === undefined) Handler = noHandler;
	if (HTMLPrinter === undefined) HTMLPrinter = null;

	if (datatypeIs(FourCC, 'string'))
		if (!handlers.find((handler) => handler.cccc == FourCC))
			handlers.push({ cccc: FourCC, label: Label, func: Handler, html_outputter: HTMLPrinter });

	if (datatypeIs(FourCC, 'array'))
		FourCC.forEach((cc) => {
			if (!handlers.find((handler) => handler.cccc == cc))
				handlers.push({ cccc: cc, label: Label, func: Handler, html_outputter: HTMLPrinter });
		});
}

const noHandler = () => '';

const registerFactories = [
	registerAC4,
	registerAV1,
	registerAVC,
	registerAVS3,
	registerDTS,
	registerEVC,
	registerHEVC,
	registerLCEVC,
	registerMisc,
	registerMPEG,
	registerMPEGH,
	registerText,
	registerVC1,
	registerVP9,
	registerVVC,
];

registerFactories.forEach(function (fact) {
	fact(addHandler);
});
