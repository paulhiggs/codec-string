/**
 * @copyright: Copyright (c) 2023
 * @author: Paul Higgs
 * @file: decode-mpeg.js
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

/** examples from ISO/IEC 13818-1:2008
 * Examples:
 *  ISO/IEC 13818-2 Main Profile
 *      video/mp2ts;codecs="mp2v.61"
 *    ISO/IEC 13818-3 is represented
 *      video/mp2ts;codecs="mp2a.69"
 *    ISO/IEC 13818-7 Low Complexity Profile
 *      video/mp2ts;codecs="mp2a.67"
 *    Dolby AC-3 audio (per ATSC A/52, AC-3 audio has stream_type 0x81 and
 *    format_identifier “AC-3” in the registration_descriptor)
 *      video/mp2ts;codecs="ac-3"
 *    ISO/IEC 13818-2 Main Profile Video together with ISO/IEC 13818-7 audio
 *      video/mp2ts;codecs="mp2v.61,mp2a.67"
 */

// MP4 Registration Authority ObjectTypeIndication (OTI)
// https://mp4ra.org/#/object_types

const DEBUGGING = false;

import { hexDigits } from './utils.js';
import { normal, error, warning } from './decode.js';
import { simpleHTML } from './formatters.js';

const MP4OTI = (val) => {
	let r = null;
	if ((val >= 0xc0 && val <= 0xe0) || (val >= 0xe2 && val <= 0xfe)) r = 'user private';
	else
		switch (val) {
			case 0:
				r = 'Forbidden';
				break;
			case 1:
			case 2:
				r = 'Systems ISO/IEC 14496-1 (a)';
				break;
			case 3:
				r = 'interaction stream';
				break;
			case 4:
				r = 'Extended BIFS';
				break;
			case 5:
				r = 'AFX Stream';
				break;
			case 6:
				r = 'Font Data Stream';
				break;
			case 7:
				r = 'Synthetised Texture';
				break;
			case 8:
				r = 'Text Stream';
				break;
			case 9:
				r = 'LASeR Stream';
				break;
			case 0x0a:
				r = 'Simple Aggregation Format (SAF) Stream';
				break;
			case 0x20:
				r = 'Visual ISO/IEC 14496-2';
				break;
			case 0x21:
				r = 'Visual ITU-T Recommendation H.264 | ISO/IEC 14496-10';
				break;
			case 0x22:
				r = 'Parameter Sets for ITU-T Recommendation H.264 | ISO/IEC 14496-10';
				break;
			case 0x23:
				r = 'Visual ISO/IEC 23008-2 | ITU-T Recommendation H.265';
				break;
			case 0x40:
				r = 'Audio ISO/IEC 14496-3';
				break;
			case 0x60:
				r = 'Visual ISO/IEC 13818-2 Simple Profile';
				break;
			case 0x61:
				r = 'Visual ISO/IEC 13818-2 Main Profile';
				break;
			case 0x62:
				r = 'Visual ISO/IEC 13818-2 SNR Profile';
				break;
			case 0x63:
				r = 'Visual ISO/IEC 13818-2 Spatial Profile';
				break;
			case 0x64:
				r = 'Visual ISO/IEC 13818-2 High Profile';
				break;
			case 0x65:
				r = 'Visual ISO/IEC 13818-2 422 Profile';
				break;
			case 0x66:
				r = 'Audio ISO/IEC 13818-7 Main Profile';
				break;
			case 0x67:
				r = 'Audio ISO/IEC 13818-7 Low Complexity Profile';
				break;
			case 0x68:
				r = 'Audio ISO/IEC 13818-7 Scaleable Sampling Rate Profile';
				break;
			case 0x69:
				r = 'Audio ISO/IEC 13818-3';
				break;
			case 0x6a:
				r = 'Visual ISO/IEC 11172-2';
				break;
			case 0x6b:
				r = 'Audio ISO/IEC 11172-3';
				break;
			case 0x6c:
				r = 'Visual ISO/IEC 10918-1';
				break;
			case 0x6d:
				r = 'Portable Network Graphics';
				break;
			case 0x6e:
				r = 'Visual ISO/IEC 15444-1 (JPEG 2000)';
				break;
			case 0xa0:
				r = 'EVRC Voice';
				break;
			case 0xa1:
				r = 'SMV Voice';
				break;
			case 0xa2:
				r = '3GPP2 Compact Multimedia Format (CMF)';
				break;
			case 0xa3:
				r = 'SMPTE VC-1 Video';
				break;
			case 0xa4:
				r = 'Dirac Video Coder';
				break;
			case 0xa5:
				return warning('withdrawn, unused, do not use (was AC-3)');
			case 0xa6:
				return warning('withdrawn, unused, do not use (was Enhanced AC-3)');
			case 0xa7:
				r = 'DRA Audio';
				break;
			case 0xa8:
				r = 'ITU G.719 Audio';
				break;
			case 0xa9:
				r = 'Core Substream';
				break;
			case 0xaa:
				r = 'Core Substream + Extension Substream';
				break;
			case 0xab:
				r = 'Extension Substream containing only XLL';
				break;
			case 0xac:
				r = 'Extension Substream containing only LBR';
				break;
			case 0xad:
				r = 'Opus audio';
				break;
			case 0xae:
				return warning('withdrawn, unused, do not use (was AC-4)');
			case 0xaf:
				r = 'Auro-Cx 3D audio';
				break;
			case 0xb0:
				r = 'RealVideo Codec 11';
				break;
			case 0xb1:
				r = 'VP9 Video';
				break;
			case 0xb2:
				r = 'DTS-UHD profile 2';
				break;
			case 0xb3:
				r = 'DTS-UHD profile 3 or higher';
				break;
			case 0xe1:
				r = '13K Voice';
				break;
			case 0xff:
				r = 'no object type specified';
				break;
		}
	return r ? normal(`ObjectTypeIndication=${r}`) : error(`unspecified object type (${val.toString(16)})`);
};

const AudioLayer = (layer) => {
	// layer field in ISO/IEC 11172-3
	let l = null;
	switch (layer) {
		case 3:
			l = '1';
			break;
		case 2:
			l = '2';
			break;
		case 1:
			l = '3';
			break;
	}
	return l ? normal(`Layer=${l}`) : error(`invalid layer (${layer})`);
};

// ISO/IEC 13818-2
export function decodeMPEG2video(val) {
	const parts = val.split('.');
	if (parts.length != 2) return [error('invalid format')];
	if (!hexDigits(parts[1])) return [error('parameters contains non-hex digits')];
	return [MP4OTI(parseInt(parts[1], 16))];
}

// ISO/IEC 13818-7
export function decodeMPEG2audio(val) {
	const parts = val.split('.');
	if (parts.length < 2 || parts.length > 3) return [error('invalid format')];
	if (!hexDigits(parts[1])) return [error('parameters contains non-hex digits')];

	const oti = parseInt(parts[1], 16);
	const res = [];
	res.push(MP4OTI(oti));
	if (oti == 0x69) res.push(AudioLayer(2, parseInt(parts[2])));

	return res;
}

export function decodeMPEG1video(val) {
	const parts = val.split('.');
	if (parts.length != 2) return [error('invalid format')];
	if (!hexDigits(parts[1])) return [error('parameters contains non-hex digits')];
	return [MP4OTI(parseInt(parts[1], 16))];
}

export function decodeMPEG1audio(val) {
	const parts = val.split('.');
	if (parts.length < 2 || parts.length > 3) return [error('invalid format')];
	if (!hexDigits(parts[1])) return [error('parameters contains non-hex digits')];

	const oti = parseInt(parts[1], 16);
	const res = [];
	res.push(MP4OTI(oti));
	if (oti == 0x6b) res.push(AudioLayer(1, parseInt(parts[2], 16)));
	return res;
}

/* 
   RFC6381 - https://tools.ietf.org/html/rfc6381
   When the first element of a value is 'mp4a' (indicating some kind of
   MPEG-4 audio), or 'mp4v' (indicating some kind of MPEG-4 part-2
   video), or 'mp4s' (indicating some kind of MPEG-4 Systems streams
   such as MPEG-4 BInary Format for Scenes (BIFS)), the second element
   is the hexadecimal representation of the MP4 Registration Authority
   ObjectTypeIndication (OTI), as specified in [MP4RA] and [MP41]
   (including amendments).  Note that [MP4RA] uses a leading "0x" with
   these values, which is omitted here and hence implied.

   One of the OTI values for 'mp4a' is 40 (identifying MPEG-4 audio).
   For this value, the third element identifies the audio
   ObjectTypeIndication (OTI) as defined in [MP4A] (including
   amendments), expressed as a decimal number.

   For example, AAC low complexity (AAC-LC) has the value 2, so a
   complete string for AAC-LC would be "mp4a.40.2".
   
   [MP4RA] - http://www.mp4ra.org
   [MP4A] - "Information technology--Coding of audio-visual objects -- Part 3: Audio", ISO/IEC 14496-3:2009.
   [MP4V] - "Information technology--Coding of audio-visual objects -- Part 2: Video", ISO/IEC 14496-2:2004.
   [MP41] - "Information technology--Coding of audio-visual objects -- Part 1: Systems", ISO/IEC 14496-1:2010.
  */

const ProfileLevelIndication = (pli) => {
	// Table G-1 in Annex G of ISO/IEC 14496-2 (3rd edition)
	switch (pli) {
		case 0x01:
			return normal('Simple Profile/Level 1');
		case 0x02:
			return normal('Simple Profile/Level 2');
		case 0x03:
			return normal('Simple Profile/Level 3');
		case 0x08:
			return normal('Simple Profile/Level 0');
		case 0x10:
			return normal('Simple Scalable Profile/Level 0');
		case 0x11:
			return normal('Simple Scalable Profile/Level 1');
		case 0x12:
			return normal('Simple Scalable Profile/Level 2');
		case 0x21:
			return normal('Core Profile/Level 1');
		case 0x22:
			return normal('Core Profile/Level 2');
		case 0x32:
			return normal('Main Profile/Level 2');
		case 0x33:
			return normal('Main Profile/Level 3');
		case 0x34:
			return normal('Main Profile/Level 4');
		case 0x42:
			return normal('N-bit Profile/Level 2');
		case 0x51:
			return normal('Scalable Texture Profile/Level 1');
		case 0x61:
			return normal('Simple Face Animation Profile/Level 1');
		case 0x62:
			return normal('Simple Face Animation Profile/Level 2');
		case 0x63:
			return normal('Simple FBA Profile/Level 1');
		case 0x64:
			return normal('Simple FBA Profile/Level 2');
		case 0x71:
			return normal('Basic Animated Texture Profile/Level 1');
		case 0x72:
			return normal('Basic Animated Texture Profile/Level 2');
		case 0x81:
			return normal('Hybrid Profile/Level 1');
		case 0x82:
			return normal('Hybrid Profile/Level 2');
		case 0x91:
			return normal('Advanced Real Time Simple Profile/Level 1');
		case 0x92:
			return normal('Advanced Real Time Simple Profile/Level 2');
		case 0x93:
			return normal('Advanced Real Time Simple Profile/Level 3');
		case 0x94:
			return normal('Advanced Real Time Simple Profile/Level 4');
		case 0xa1:
			return normal('Core Scalable Profile/Level 1');
		case 0xa2:
			return normal('Core Scalable Profile/Level 2');
		case 0xa3:
			return normal('Core Scalable Profile/Level 3');
		case 0xb1:
			return normal('Advanced Coding Efficiency Profile/Level 1');
		case 0xb2:
			return normal('Advanced Coding Efficiency Profile/Level 2');
		case 0xb3:
			return normal('Advanced Coding Efficiency Profile/Level 3');
		case 0xb4:
			return normal('Advanced Coding Efficiency Profile/Level 4');
		case 0xc1:
			return normal('Advanced Core Profile/Level 1');
		case 0xc2:
			return normal('Advanced Core Profile/Level 2');
		case 0xd1:
			return normal('Advanced Scalable Texture/Level 1');
		case 0xd2:
			return normal('Advanced Scalable Texture/Level 2');
		case 0xd3:
			return normal('Advanced Scalable Texture/Level 3');
		case 0xe1:
			return normal('Simple Studio Profile/Level 1');
		case 0xe2:
			return normal('Simple Studio Profile/Level 2');
		case 0xe3:
			return normal('Simple Studio Profile/Level 3');
		case 0xe4:
			return normal('Simple Studio Profile/Level 4');
		case 0xe5:
			return normal('Core Studio Profile/Level 1');
		case 0xe6:
			return normal('Core Studio Profile/Level 2');
		case 0xe7:
			return normal('Core Studio Profile/Level 3');
		case 0xe8:
			return normal('Core Studio Profile/Level 4');
		case 0xf0:
			return normal('Advanced Simple Profile/Level 0');
		case 0xf1:
			return normal('Advanced Simple Profile/Level 1');
		case 0xf2:
			return normal('Advanced Simple Profile/Level 2');
		case 0xf3:
			return normal('Advanced Simple Profile/Level 3');
		case 0xf4:
			return normal('Advanced Simple Profile/Level 4');
		case 0xf5:
			return normal('Advanced Simple Profile/Level 5');
		case 0xf7:
			return normal('Advanced Simple Profile/Level 3b');
		case 0xf8:
			return normal('Fine Granularity Scalable Profile/Level 0');
		case 0xf9:
			return normal('Fine Granularity Scalable Profile/Level 1');
		case 0xfa:
			return normal('Fine Granularity Scalable Profile/Level 2');
		case 0xfb:
			return normal('Fine Granularity Scalable Profile/Level 3');
		case 0xfc:
			return normal('Fine Granularity Scalable Profile/Level 4');
		case 0xfd:
			return normal('Fine Granularity Scalable Profile/Level 5');
		case 0xff:
			return warning('Reserved for Escape');
	}
	return warning('Reserved');
};

const MPEGvideoOTI = (oti, pli = null) => {
	switch (oti) {
		case 0x20: {
			const res = ['Visual ISO/IEC 14496-2'];
			if (pli) res.push(ProfileLevelIndication(pli));
			return res;
		}
		case 0x21:
			return [normal('Visual ITU-T Recommendation H.264 | ISO/IEC 14496-10')];
		case 0x22:
			return [normal('Parameter Sets for ITU-T Recommendation H.264 | ISO/IEC 14496-10')];
		case 0x23:
			return [normal('Visual ISO/IEC 23008-2 | ITU-T Recommendation H.265')];
		case 0x60:
			return [normal('Visual ISO/IEC 13818-2 Simple Profile')];
		case 0x61:
			return [normal('Visual ISO/IEC 13818-2 Main Profile')];
		case 0x62:
			return [normal('Visual ISO/IEC 13818-2 SNR Profile')];
		case 0x63:
			return [normal('Visual ISO/IEC 13818-2 Spatial Profile')];
		case 0x64:
			return [normal('Visual ISO/IEC 13818-2 High Profile')];
		case 0x65:
			return [normal('Visual ISO/IEC 13818-2 422 Profile')];
	}
	return [error(`invalid value for Object Type Identifier (${oti})`)];
};

export function decodeMPEG4video(val) {
	const parts = val.split('.');
	if (parts.length < 2 || parts.length > 3) return [error('invalid format')];
	if (!hexDigits(parts[1]) || (parts.length == 3 && !hexDigits(parts[2]))) return [error('parameters contains non-hex digits')];

	// https://www.ietf.org/rfc/rfc4281.txt
	return MPEGvideoOTI(parseInt(parts[1], 16), parts.length >= 3 ? parseInt(parts[2]) : null);
}

const MPEGaudioOTI = (oti, aacMode = null) => {
	switch (oti) {
		case 0x40: {
			const t = [];
			t.push(normal('MPEG-4 AAC (40)'));
			if (aacMode) {
				const vals = [
					{ i: 1, s: 'Main' },
					{ i: 2, s: 'Low-Complexity AAC' },
					{ i: 3, s: 'SSR AAC' },
					{ i: 4, s: 'LTP AAC' },
					{ i: 5, s: 'High-Efficiency (SBR) AAC' },
					{ i: 6, s: 'MPEG-4 AAC-Scalable' },
					{ i: 7, s: 'MPEG-4 TWIN VQ' },
					{ i: 8, s: 'MPEG-4 CELP' },
					{ i: 9, s: 'MPEG-4 HVCX' },
					{ i: 12, s: 'MPEG-4 TTSI' },
					{ i: 13, s: 'MPEG-4 Main Synthetic' },
					{ i: 14, s: 'MPEG-4 Wavetable Synthetis' },
					{ i: 15, s: 'MPEG-4 General Midi' },
					{ i: 16, s: 'MPEG-4 ALGO_SYNTH_AUDIO_FX' },
					{ i: 17, s: 'MPEG-4 ER_AAC_LC' },
					{ i: 19, s: 'MPEG-4 ER_AAC_LTP' },
					{ i: 20, s: 'MPEG-4 ER_AAC_SCALABLE' },
					{ i: 21, s: 'MPEG-4 ER_TWINVQ' },
					{ i: 22, s: 'MPEG-4 ER_BSAC' },
					{ i: 23, s: 'MPEG-4 ER_AAC_LD' },
					{ i: 24, s: 'MPEG-4 ER_AAC_LD' },
					{ i: 25, s: 'MPEG-4 ER_HVXC' },
					{ i: 26, s: 'MPEG-4 ER_HILN' },
					{ i: 27, s: 'MPEG-4 ER_PARAMETRIC' },
					{ i: 28, s: 'MPEG-4 SSC' },
					{ i: 29, s: 'MPEG-4 AAC_PS' },
					{ i: 32, s: 'MPEG-4 LAYER1' },
					{ i: 33, s: 'MPEG-4 LAYER2' },
					{ i: 34, s: 'MPEG-4 LAYER3' },
					{ i: 35, s: 'MPEG-4 DST' },
					{ i: 36, s: 'MPEG-4 ALS' },
				];
				const found = vals.find((elem) => aacMode == elem.i);
				t.push(found ? normal(`${found.s} (${found.i})`) : error(`invalid AAC OTI (${aacMode})`));
			}
			return t;
		}
		case 0x66:
			return [normal('MPEG-2 AAC Main Profile (66)')];
		case 0x67:
			return [normal('MPEG-2 AAC Low Complexity Profile (67)')];
		case 0x68:
			return [normal('MPEG-2 AAC Scalable Sampling Rate Profile (68)')];
		case 0x69:
			return [normal('MPEG-2 Audio Part 3 (69)')];
		case 0x6b:
			return [normal('MPEG-1 Part 3 (6B)')];
	}
	return [error(`invalid MP4 Audio Object Type Iindicator (${oti})`)];
};

export function decodeMPEG4audio(val) {
	const parts = val.split('.');
	if (parts.length < 2) return [error('invalid format')];
	if (!hexDigits(parts[1])) return [error('OTI must be expressed in hexadecimal')];

	// https://cconcolato.github.io/media-mime-support/
	return MPEGaudioOTI(parseInt(parts[1], 16), parts.length >= 3 ? parseInt(parts[2]) : null);
}

function outputHTML(label, messages) {
	return simpleHTML(label, messages, DEBUGGING);
}

export function registerMPEG(addHandler) {
	addHandler('mp4a', 'AAC', decodeMPEG4audio, outputHTML);
	addHandler('mp4v', 'MPEG-4 video', decodeMPEG4video, outputHTML);
	addHandler('mp2v', 'MPEG-2 video', decodeMPEG2video, outputHTML);
	addHandler('mp2a', 'MPEG-2 audio', decodeMPEG2audio, outputHTML);
	addHandler('mp1v', 'MPEG-1 video', decodeMPEG1video, outputHTML);
	addHandler('mp1a', 'MPEG-1 audio', decodeMPEG1audio, outputHTML);

	addHandler('tx3g', ''); /* stream_type == 0x1D */
	addHandler('mjp2', ''); /* stream_type == 0x21 */
}
