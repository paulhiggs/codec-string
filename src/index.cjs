const { decodeAC4 } = require('./decode-ac4.js');
const { decodeAV1 } = require('./decode-av1.js');
const { decodeAVC } = require('./decode-avc.js');
const { decodeAVS3 } = require('./decode-avs.js');
const { decodeDTS } = require('./decode-dts.js');
const { decodeEVC } = require('./decode-evc.js');
const { decodeHEVC } = require('./decode-hevc.js');
const { decodeMPEG2video, decodeMPEG2audio, decodeMPEG1video, decodeMPEG1audio, decodeMPEG4video, decodeMPEG4audio } = require('./decode-mpeg.js');
const { decodeMPEGH } = require('./decode-mpegH.js');
const { decodeSTPP } = require('./decode-text.js');
const { decodeVP9 } = require('./decode-vp9.js');
const { decodeVVC } = require('./decode-vvc.js');
const { decode } = require('./decode.js');
const { DVBclassification } = require('./dvb-mapping.js');
const { simpleHTML, tabularHTML } = require('./formatters.js');

module.exports = {
	decodeAC4,
	decodeAV1,
	decodeAVC,
	decodeAVS3,
	decodeDTS,
	decodeEVC,
	decodeHEVC,
	decodeMPEG2video,
	decodeMPEG2audio,
	decodeMPEG1video,
	decodeMPEG1audio,
	decodeMPEG4video,
	decodeMPEG4audio,
	decodeMPEGH,
	decodeSTPP,
	decodeVP9,
	decodeVVC,
	decode,
	DVBclassification,
	simpleHTML,
	tabularHTML,
};
