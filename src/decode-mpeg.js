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

import { BREAK, err, warn } from './markup.js';
import { hexDigits } from './utils.js';

const MP4OTI = (val) => {
	if ((val >= 0xc0 && val <= 0xe0) || (val >= 0xe2 && val <= 0xfe)) return 'user private';
	switch (val) {
		case 0:
			return 'Forbidden';
		case 1:
		case 2:
			return 'Systems ISO/IEC 14496-1 (a)';
		case 3:
			return 'interaction stream';
		case 4:
			return 'Extended BIFS';
		case 5:
			return 'AFX Stream';
		case 6:
			return 'Font Data Stream';
		case 7:
			return 'Synthetised Texture';
		case 8:
			return 'Text Stream';
		case 9:
			return 'LASeR Stream';
		case 0x0a:
			return 'Simple Aggregation Format (SAF) Stream';
		case 0x20:
			return 'Visual ISO/IEC 14496-2';
		case 0x21:
			return 'Visual ITU-T Recommendation H.264 | ISO/IEC 14496-10';
		case 0x22:
			return 'Parameter Sets for ITU-T Recommendation H.264 | ISO/IEC 14496-10';
		case 0x23:
			return 'Visual ISO/IEC 23008-2 | ITU-T Recommendation H.265';
		case 0x40:
			return 'Audio ISO/IEC 14496-3';
		case 0x60:
			return 'Visual ISO/IEC 13818-2 Simple Profile';
		case 0x61:
			return 'Visual ISO/IEC 13818-2 Main Profile';
		case 0x62:
			return 'Visual ISO/IEC 13818-2 SNR Profile';
		case 0x63:
			return 'Visual ISO/IEC 13818-2 Spatial Profile';
		case 0x64:
			return 'Visual ISO/IEC 13818-2 High Profile';
		case 0x65:
			return 'Visual ISO/IEC 13818-2 422 Profile';
		case 0x66:
			return 'Audio ISO/IEC 13818-7 Main Profile';
		case 0x67:
			return 'Audio ISO/IEC 13818-7 Low Complexity Profile';
		case 0x68:
			return 'Audio ISO/IEC 13818-7 Scaleable Sampling Rate Profile';
		case 0x69:
			return 'Audio ISO/IEC 13818-3';
		case 0x6a:
			return 'Visual ISO/IEC 11172-2';
		case 0x6b:
			return 'Audio ISO/IEC 11172-3';
		case 0x6c:
			return 'Visual ISO/IEC 10918-1';
		case 0x6d:
			return 'Portable Network Graphics';
		case 0x6e:
			return 'Visual ISO/IEC 15444-1 (JPEG 2000)';
		case 0xa0:
			return 'EVRC Voice';
		case 0xa1:
			return 'SMV Voice';
		case 0xa2:
			return '3GPP2 Compact Multimedia Format (CMF)';
		case 0xa3:
			return 'SMPTE VC-1 Video';
		case 0xa4:
			return 'Dirac Video Coder';
		case 0xa5:
			return warn('withdrawn, unused, do not use (was AC-3)');
		case 0xa6:
			return warn('withdrawn, unused, do not use (was Enhanced AC-3)');
		case 0xa7:
			return 'DRA Audio';
		case 0xa8:
			return 'ITU G.719 Audio';
		case 0xa9:
			return 'Core Substream';
		case 0xaa:
			return 'Core Substream + Extension Substream';
		case 0xab:
			return 'Extension Substream containing only XLL';
		case 0xac:
			return 'Extension Substream containing only LBR';
		case 0xad:
			return 'Opus audio';
		case 0xae:
			return warn('withdrawn, unused, do not use (was AC-4)');
		case 0xaf:
			return 'Auro-Cx 3D audio';
		case 0xb0:
			return 'RealVideo Codec 11';
		case 0xb1:
			return 'VP9 Video';
		case 0xb2:
			return 'DTS-UHD profile 2';
		case 0xb3:
			return 'DTS-UHD profile 3 or higher';
		case 0xe1:
			return '13K Voice';
		case 0xff:
			return 'no object type specified';
	}
	return err(`unspecified object type (${val.toString(16)})`);
};

const AudioLayer = (layer) => {
	// layer field in ISO/IEC 11172-3
	switch (layer) {
		case 3:
			return '1';
		case 2:
			return '2';
		case 1:
			return '3';
	}
	return err(`invalid layer (${layer})`);
};

// ISO/IEC 13818-2
export function decodeMPEG2video(val) {
	const parts = val.split('.');
	if (parts.length != 2) return err('invalid format') + BREAK;
	if (!hexDigits(parts[1])) return err('parameters contains non-hex digits') + BREAK;
	return 'ObjectTypeIndication=' + MP4OTI(parseInt(parts[1], 16)) + BREAK;
}

// ISO/IEC 13818-7
export function decodeMPEG2audio(val) {
	const parts = val.split('.');
	if (parts.length < 2 || parts.length > 3) return err('invalid format') + BREAK;
	if (!hexDigits(parts[1])) return err('parameters contains non-hex digits') + BREAK;

	const oti = parseInt(parts[1], 16);
	let res = 'ObjectTypeIndication=' + MP4OTI(oti) + BREAK;
	if (oti == 0x69) res += 'Layer=' + AudioLayer(2, parseInt(parts[2])) + BREAK;

	return res;
}

export function decodeMPEG1video(val) {
	const parts = val.split('.');
	if (parts.length != 2) return err('invalid format') + BREAK;
	if (!hexDigits(parts[1])) return err('parameters contains non-hex digits') + BREAK;
	return 'ObjectTypeIndication=' + MP4OTI(parseInt(parts[1], 16)) + BREAK;
}

export function decodeMPEG1audio(val) {
	const parts = val.split('.');
	if (parts.length < 2 || parts.length > 3) return err('invalid format') + BREAK;
	if (!hexDigits(parts[1])) return err('parameters contains non-hex digits') + BREAK;

	const oti = parseInt(parts[1], 16);
	let res = 'ObjectTypeIndication=' + MP4OTI(oti) + BREAK;
	if (oti == 0x6b) res += 'Layer=' + AudioLayer(1, parseInt(parts[2], 16)) + BREAK;
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
			return 'Simple Profile/Level 1';
		case 0x02:
			return 'Simple Profile/Level 2';
		case 0x03:
			return 'Simple Profile/Level 3';
		case 0x08:
			return 'Simple Profile/Level 0';
		case 0x10:
			return 'Simple Scalable Profile/Level 0';
		case 0x11:
			return 'Simple Scalable Profile/Level 1';
		case 0x12:
			return 'Simple Scalable Profile/Level 2';
		case 0x21:
			return 'Core Profile/Level 1';
		case 0x22:
			return 'Core Profile/Level 2';
		case 0x32:
			return 'Main Profile/Level 2';
		case 0x33:
			return 'Main Profile/Level 3';
		case 0x34:
			return 'Main Profile/Level 4';
		case 0x42:
			return 'N-bit Profile/Level 2';
		case 0x51:
			return 'Scalable Texture Profile/Level 1';
		case 0x61:
			return 'Simple Face Animation Profile/Level 1';
		case 0x62:
			return 'Simple Face Animation Profile/Level 1';
		case 0x63:
			return 'Simple FBA Profile/Level 1';
		case 0x64:
			return 'Simple FBA Profile/Level 2';
		case 0x71:
			return 'Basic Animated Texture Profile/Level 1';
		case 0x72:
			return 'Basic Animated Texture Profile/Level 2';
		case 0x81:
			return 'Hybrid Profile/Level 1';
		case 0x82:
			return 'Hybrid Profile/Level 2';
		case 0x91:
			return 'Advanced Real Time Simple Profile/Level 1';
		case 0x92:
			return 'Advanced Real Time Simple Profile/Level 2';
		case 0x93:
			return 'Advanced Real Time Simple Profile/Level 3';
		case 0x94:
			return 'Advanced Real Time Simple Profile/Level 4';
		case 0xa1:
			return 'Core Scalable Profile/Level 1';
		case 0xa2:
			return 'Core Scalable Profile/Level 2';
		case 0xa3:
			return 'Core Scalable Profile/Level 3';
		case 0xb1:
			return 'Advanced Coding Efficiency Profile/Level 1';
		case 0xb2:
			return 'Advanced Coding Efficiency Profile/Level 2';
		case 0xb3:
			return 'Advanced Coding Efficiency Profile/Level 3';
		case 0xb4:
			return 'Advanced Coding Efficiency Profile/Level 4';
		case 0xc1:
			return 'Advanced Core Profile/Level 1';
		case 0xc2:
			return 'Advanced Core Profile/Level 2';
		case 0xd1:
			return 'Advanced Scalable Texture/Level 1';
		case 0xd2:
			return 'Advanced Scalable Texture/Level 2';
		case 0xd3:
			return 'Advanced Scalable Texture/Level 3';
		case 0xe1:
			return 'Simple Studio Profile/Level 1';
		case 0xe2:
			return 'Simple Studio Profile/Level 2';
		case 0xe3:
			return 'Simple Studio Profile/Level 3';
		case 0xe4:
			return 'Simple Studio Profile/Level 4';
		case 0xe5:
			return 'Core Studio Profile/Level 1';
		case 0xe6:
			return 'Core Studio Profile/Level 2';
		case 0xe7:
			return 'Core Studio Profile/Level 3';
		case 0xe8:
			return 'Core Studio Profile/Level 4';
		case 0xf0:
			return 'Advanced Simple  Profile/Level 0';
		case 0xf1:
			return 'Advanced Simple  Profile/Level 1';
		case 0xf2:
			return 'Advanced Simple  Profile/Level 2';
		case 0xf3:
			return 'Advanced Simple  Profile/Level 3';
		case 0xf4:
			return 'Advanced Simple  Profile/Level 4';
		case 0xf5:
			return 'Advanced Simple  Profile/Level 5';
		case 0xf7:
			return 'Advanced Simple  Profile/Level 3b';
		case 0xf8:
			return 'Fine Granularity Scalable Profile/Level 0';
		case 0xf9:
			return 'Fine Granularity Scalable Profile/Level 1';
		case 0xfa:
			return 'Fine Granularity Scalable Profile/Level 2';
		case 0xfb:
			return 'Fine Granularity Scalable Profile/Level 3';
		case 0xfc:
			return 'Fine Granularity Scalable Profile/Level 4';
		case 0xfd:
			return 'Fine Granularity Scalable Profile/Level 5';
		case 0xff:
			return warn('Reserved for Escape');
	}
	return warn('Reserved');
};

const MPEGvideoOTI = (oti, pli = null) => {
	switch (oti) {
		case 0x20: {
			let res = 'Visual ISO/IEC 14496-2';
			if (pli) res += BREAK + ProfileLevelIndication(pli);
			return res;
		}
		case 0x21:
			return 'Visual ITU-T Recommendation H.264 | ISO/IEC 14496-10';
		case 0x22:
			return 'Parameter Sets for ITU-T Recommendation H.264 | ISO/IEC 14496-10';
		case 0x23:
			return 'Visual ISO/IEC 23008-2 | ITU-T Recommendation H.265';
		case 0x60:
			return 'Visual ISO/IEC 13818-2 Simple Profile';
		case 0x61:
			return 'Visual ISO/IEC 13818-2 Main Profile';
		case 0x62:
			return 'Visual ISO/IEC 13818-2 SNR Profile';
		case 0x63:
			return 'Visual ISO/IEC 13818-2 Spatial Profile';
		case 0x64:
			return 'Visual ISO/IEC 13818-2 High Profile';
		case 0x65:
			return 'Visual ISO/IEC 13818-2 422 Profile';
	}
	return err(`invalid value for Object Type Identifier (${oti})`);
};

export function decodeMPEG4video(val) {
	const parts = val.split('.');
	if (parts.length < 2 || parts.length > 3) return err('invalid format') + BREAK;
	if (!hexDigits(parts[1]) || (parts.length == 3 && !hexDigits(parts[2]))) return err('parameters contains non-hex digits') + BREAK;

	// https://www.ietf.org/rfc/rfc4281.txt
	return MPEGvideoOTI(parseInt(parts[1], 16), parts.length >= 3 ? parseInt(parts[2]) : null) + BREAK;
}

const MPEGaudioOTI = (oti, aacMode = null) => {
	switch (oti) {
		case 0x40: {
			let res = 'MPEG-4 AAC (40)';
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
				res += BREAK + (found ? `${found.s} (${found.i})` : err(`invalid AAC OTI (${aacMode})`));
			}
			return res;
		}
		case 0x66:
			return 'MPEG-2 AAC Main Profile (66)';
		case 0x67:
			return 'MPEG-2 AAC Low Complexity Profile (67)';
		case 0x68:
			return 'MPEG-2 AAC Scalable Sampling Rate Profile (68)';
		case 0x69:
			return 'MPEG-2 Audio Part 3 (69)';
		case 0x6b:
			return 'MPEG-1 Part 3 (6B)';
	}
	return err(`invalid MP4 Audio Object Type Iindicator (${oti})`);
};

export function decodeMPEG4audio(val) {
	const parts = val.split('.');
	if (parts.length < 2) return err('invalid format');
	if (!hexDigits(parts[1])) return err('OTI must be expressed in hexadecimal');

	// https://cconcolato.github.io/media-mime-support/
	return MPEGaudioOTI(parseInt(parts[1], 16), parts.length >= 3 ? parseInt(parts[2]) : null) + BREAK;
}

export function registerMPEG(addHandler) {
	addHandler('mp4a', 'AAC', decodeMPEG4audio);
	addHandler('mp4v', 'MPEG-4 video', decodeMPEG4video);
	addHandler('mp2v', 'MPEG-2 video', decodeMPEG2video);
	addHandler('mp2a', 'MPEG-2 audio', decodeMPEG2audio);
	addHandler('mp1v', 'MPEG-1 video', decodeMPEG1video);
	addHandler('mp1a', 'MPEG-1 audio', decodeMPEG1audio);

	addHandler('tx3g', ''); /* stream_type == 0x1D */
	addHandler('mjp2', ''); /* stream_type == 0x21 */
}
