import { registerAAC } from './decode-aac.js';
import { registerAC4 } from './decode-ac4.js';
import { registerAV1 } from './decode-av1.js';
import { registerAVC } from './decode-avc.js';
import { registerAVS3 } from './decode-avs.js';
import { registerEVC } from './decode-evc.js';
import { registerHEVC } from './decode-hevc.js';
import { registerMisc } from './decode-misc.js';
import { registerMPEG } from './decode-mpeg.js';
import { registerMPEGH } from './decode-mpegH.js';
import { registerText } from './decode-text.js';
import { registerVC1 } from './decode-vc1.js';
import { registerVP9 } from './decode-vp9.js';
import { registerVVC } from './decode-vvc.js';

const handlers = [];

export function findHandler(codec) {
	return handlers.find((h) => h.cccc == codec.toLowerCase());
}

function addHandler(FourCC, Label, Handler) {
	if (Handler === undefined) {
		Handler = noHandler;
	}

	if (typeof FourCC == 'string' || FourCC instanceof String)
		if (!handlers.find((handler) => handler.cccc == FourCC.toLowerCase()))
			handlers.push({
				cccc: FourCC.toLowerCase(),
				label: Label,
				func: Handler,
			});

	if (Array.isArray(FourCC))
		FourCC.forEach((cc) => {
			if (!handlers.find((handler) => handler.cccc == cc.toLowerCase()))
				handlers.push({ cccc: cc.toLowerCase(), label: Label, func: Handler });
		});
}

function noHandler() {
	return '';
}

const registerFactories = [
	registerAAC,
	registerAC4,
	registerAV1,
	registerAVC,
	registerAVS3,
	registerEVC,
	registerHEVC,
	registerMisc,
	registerMPEGH,
	registerText,
	registerVP9,
	registerVVC,
	registerMPEG,
	registerVC1,
];

registerFactories.forEach(function (fact) {
	fact(addHandler);
});
