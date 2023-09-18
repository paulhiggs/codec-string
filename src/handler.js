import { registerAAC } from './decode-aac';
import { registerAC4 } from './decode-ac4';
import { registerAV1 } from './decode-av1';
import { registerAVC } from './decode-avc';
import { registerAVS3 } from './decode-avs';
import { registerEVC } from './decode-evc';
import { registerHEVC } from './decode-hevc';
import { registerMisc } from './decode-misc';
import { registerMPEGH } from './decode-mpegH';
import { registerText } from './decode-text';
import { registerVP9 } from './decode-vp9';
import { registerVVC } from './decode-vvc';

const handlers = [];

export function findHandler(codec) {
  return handlers.find((h) => h.cccc == codec.toLowerCase());
}

function addHandler(FourCC, Label, Handler) {
  if (Handler === undefined) {
    Handler = noHandler;
  }

  if (typeof FourCC == "string" || FourCC instanceof String)
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
  return "";
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
];

registerFactories.forEach(function(fact) {
  fact(addHandler);
});
