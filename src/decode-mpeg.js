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

/*jshint esversion: 6 */

/** examples from ISO/IEC 13818-1:2008
 * Examples:
 *  	ISO/IEC 13818-2 Main Profile
 *  		video/mp2ts;codecs="mp2v.61"
 * 		ISO/IEC 13818-3 is represented
 *  		video/mp2ts;codecs="mp2a.69"
 *  	ISO/IEC 13818-7 Low Complexity Profile
 *  		video/mp2ts;codecs="mp2a.67"
 *  	Dolby AC-3 audio (per ATSC A/52, AC-3 audio has stream_type 0x81 and
 * 		format_identifier “AC-3” in the registration_descriptor )
 *  		video/mp2ts;codecs="ac-3"
 * 		ISO/IEC 13818-2 Main Profile Video together with ISO/IEC 13818-7 audio
 *  		video/mp2ts;codecs="mp2v.61,mp2a.67"
 */

// MP4 Registration Authority ObjectTypeIndication (OTI)
// https://mp4ra.org/#/object_types
let MP4OTI = (val) => {
	if ((val >= 0xc0 && val <= 0xe0) || (val >= 0xe2 && val <= 0xfe)) return "user private";
	switch (val) {
		case 0:
			return "Forbidden";
		case 1:
		case 2:
			return "Systems ISO/IEC 14496-1 (a)";
		case 3:
			return "interaction stream";
		case 4:
			return "Extended BIFS";
		case 5:
			return "AFX Stream";
		case 6:
			return "Font Data Stream";
		case 7:
			return "Synthetised Texture";
		case 8:
			return "Text Stream";
		case 9:
			return "LASeR Stream";
		case 0x0a:
			return "Simple Aggregation Format (SAF) Stream";
		case 0x20:
			return "Visual ISO/IEC 14496-2";
		case 0x21:
			return "Visual ITU-T Recommendation H.264 | ISO/IEC 14496-10";
		case 0x22:
			return "Parameter Sets for ITU-T Recommendation H.264 | ISO/IEC 14496-10";
		case 0x23:
			return "Visual ISO/IEC 23008-2 | ITU-T Recommendation H.265";
		case 0x40:
			return "Audio ISO/IEC 14496-3";
		case 0x60:
			return "Visual ISO/IEC 13818-2 Simple Profile";
		case 0x61:
			return "Visual ISO/IEC 13818-2 Main Profile";
		case 0x62:
			return "Visual ISO/IEC 13818-2 SNR Profile";
		case 0x63:
			return "Visual ISO/IEC 13818-2 Spatial Profile";
		case 0x64:
			return "Visual ISO/IEC 13818-2 High Profile";
		case 0x65:
			return "Visual ISO/IEC 13818-2 422 Profile";
		case 0x66:
			return "Audio ISO/IEC 13818-7 Main Profile";
		case 0x67:
			return "Audio ISO/IEC 13818-7 Low Complexity Profile";
		case 0x68:
			return "Audio ISO/IEC 13818-7 Scaleable Sampling Rate Profile";
		case 0x69:
			return "Audio ISO/IEC 13818-3";
		case 0x6a:
			return "Visual ISO/IEC 11172-2";
		case 0x6b:
			return "Audio ISO/IEC 11172-3";
		case 0x6c:
			return "Visual ISO/IEC 10918-1";
		case 0x6d:
			return "Portable Network Graphics";
		case 0x6e:
			return "Visual ISO/IEC 15444-1 (JPEG 2000)";
		case 0xa0:
			return "EVRC Voice";
		case 0xa1:
			return "SMV Voice";
		case 0xa2:
			return "3GPP2 Compact Multimedia Format (CMF)";
		case 0xa3:
			return "SMPTE VC-1 Video";
		case 0xa4:
			return "Dirac Video Coder";
		case 0xa5:
			return warn("withdrawn, unused, do not use (was AC-3)");
		case 0xa6:
			return warn("withdrawn, unused, do not use (was Enhanced AC-3)");
		case 0xa7:
			return "DRA Audio";
		case 0xa8:
			return "ITU G.719 Audio";
		case 0xa9:
			return "Core Substream";
		case 0xaa:
			return "Core Substream + Extension Substream";
		case 0xab:
			return "Extension Substream containing only XLL";
		case 0xac:
			return "Extension Substream containing only LBR";
		case 0xad:
			return "Opus audio";
		case 0xae:
			return warn("withdrawn, unused, do not use (was AC-4)");
		case 0xaf:
			return "Auro-Cx 3D audio";
		case 0xb0:
			return "RealVideo Codec 11";
		case 0xb1:
			return "VP9 Video";
		case 0xb2:
			return "DTS-UHD profile 2";
		case 0xb3:
			return "DTS-UHD profile 3 or higher";
		case 0xe1:
			return "13K Voice";
		case 0xff:
			return "no object type specified";
	}
	return err(`unspecified object type (${val.toString(16)})`);
};

let AudioLayer = (layer) => {
	// layer field in ISO/IEC 11172-3
	switch (layer) {
		case 3:
			return "1";
		case 2:
			return "2";
		case 1:
			return "3";
	}
	return err(`invalid layer (${layer})`);
};

// ISO/IEC 13818-2
function decodeMPEG2video(val) {
	let parts = val.split(".");
	if (parts.length != 2) return err("invalid format") + BREAK;
	if (!hexDigits(parts[1])) return err("parameters contains non-hex digits") + BREAK;
	return "ObjectTypeIndication=" + MP4OTI(parseInt(parts[1], 16)) + BREAK;
}

// ISO/IEC 13818-7
function decodeMPEG2audio(val) {
	let parts = val.split(".");
	if (parts.length < 2 || parts.length > 3) return err("invalid format") + BREAK;
	if (!hexDigits(parts[1])) return err("parameters contains non-hex digits") + BREAK;

	let oti = parseInt(parts[1], 16);
	let res = "ObjectTypeIndication=" + MP4OTI(oti) + BREAK;
	if (oti == 0x69) res += "Layer=" + AudioLayer(2, parseInt(parts[2])) + BREAK;

	return res;
}

function decodeMPEG1video(val) {
	let parts = val.split(".");
	if (parts.length != 2) return err("invalid format") + BREAK;
	if (!hexDigits(parts[1])) return err("parameters contains non-hex digits") + BREAK;
	return "ObjectTypeIndication=" + MP4OTI(parseInt(parts[1], 16)) + BREAK;
}

function decodeMPEG1audio(val) {
	let parts = val.split(".");
	if (parts.length < 2 || parts.length > 3) return err("invalid format") + BREAK;
	if (!hexDigits(parts[1])) return err("parameters contains non-hex digits") + BREAK;

	let oti = parseInt(parts[1], 16);
	let res = "ObjectTypeIndication=" + MP4OTI(oti) + BREAK;
	if (oti == 0x6b) res += "Layer=" + AudioLayer(1, parseInt(parts[2], 16)) + BREAK;
	return res;
}

function decodeMPEG4video(val) {}

addHandler("mp4v", "MPEG-4 video", decodeMPEG4video);
addHandler("mp2v", "MPEG-2 video", decodeMPEG2video);
addHandler("mp2a", "MPEG-2 audio", decodeMPEG2audio);
addHandler("mp1v", "MPEG-1 video", decodeMPEG1video);
addHandler("mp1a", "MPEG-1 audio", decodeMPEG1audio);

addHandler("tx3g", "", noHandler); /* stream_type == 0x1D */
addHandler("mjp2", "", noHandler); /* stream_type == 0x21 */
