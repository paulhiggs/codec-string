/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-avc.js
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
/**
 * https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html
 * https://en.wikipedia.org/wiki/Advanced_Video_Coding
 **/

function decodeAVC(val) {
	// regex from DVB TM-STREAM0087:  /avc[1-4]\.[a-fA-F\d]{6}/

	function AVCconstraint(val, constraint) {
		// constraint 012345--
		// bit        76543210
		if (constraint < 0 || constraint > 5) return false;
		return val & Math.pow(2, 7 - constraint) ? true : false;
	}

	let parts = val.split(".");
	let res = "";

	if (parts.length != 2) return err("invalid format") + BREAK;

	if (parts[1].length != 6) return err(`invalid parameters length (${parts[1].length}) - should be 6`) + BREAK;

	if (!hexDigits(parts[1])) return err("parameters contains non-hex digits") + BREAK;

	let prof = sscanf(parts[1], "%2x%2x%2x");
	let coding_params = { type: "video", codec: parts[0] };
	res += `profile_idc=${prof[0]} constraint_set=${prof[1]} level_idc=${prof[2]}${BREAK}`;

	res += "profile=";
	switch (prof[0]) {
		case 0x2c:
			coding_params.profile = "CAVLC 4:4:4";
			res += coding_params.profile;
			break;
		case 0x42:
			coding_params.profile = `${AVCconstraint(prof[1], 1) ? "Constrained " : ""}Baseline`;
			res += coding_params.profile;
			break;
		case 0x4d:
			coding_params.profile = `${AVCconstraint(prof[1], 1) ? "Constrained " : ""}Main`;
			res += coding_params.profile;
			break;
		case 0x53:
			coding_params.profile = `Scalable ${AVCconstraint(prof[1], 5) ? "Constrained " : ""}Base`;
			res += coding_params.profile;
			break;
		case 0x56:
			coding_params.profile = "Scalable ";
			if (!AVCconstraint(prof[1], 3) && AVCconstraint(prof[1], 5)) coding_params.profile += "Constrained ";
			if (AVCconstraint(prof[1], 3) && !AVCconstraint(prof[1], 5)) coding_params.profile += "Intra ";
			coding_params.profile += "High";
			res += coding_params.profile;
			break;
		case 0x58:
			coding_params.profile = "Extended";
			res += coding_params.profile;
			break;
		case 0x63:
			coding_params.profile = `High 10${AVCconstraint(prof[1], 3) ? " Intra" : ""}`;
			res += coding_params.profile;
			break;
		case 0x64:
			coding_params.profile = "";
			if (AVCconstraint(prof[1], 4) && !AVCconstraint(prof[1], 5)) coding_params.profile += "Progressive ";
			if (!AVCconstraint(prof[1], 4) && AVCconstraint(prof[1], 5)) coding_params.profile += "Constrained ";
			coding_params.profile += "High";
			res += coding_params.profile;
			break;
		case 0x76:
			coding_params.profile = "Multiview High";
			res += coding_params.profile;
			break;
		case 0x7a:
			coding_params.profile = `High 4:2:2${AVCconstraint(prof[1], 3) ? " Intra" : ""}`;
			res += coding_params.profile;
			break;
		case 0x80:
			coding_params.profile = "Stereo High";
			res += coding_params.profile;
			break;
		case 0x86:
			coding_params.profile = "MFC High";
			res += coding_params.profile;
			break;
		case 0x87:
			coding_params.profile = "MFC Depth High";
			res += coding_params.profile;
			break;
		case 0x8a:
			coding_params.profile = "Multiview Depth High High";
			res += coding_params.profile;
			break;
		case 0x8b:
			coding_params.profile = "Enhanced Multiview Depth High High";
			res += coding_params.profile;
			break;
		case 0xf4:
			coding_params.profile = `High 4:4:4${AVCconstraint(prof[1], 3) ? " Intra" : " Predictive"}`;
			res += coding_params.profile;
			break;
		default:
			coding_params.profile = "invalid";
			res += err("unknown");
	}
	res += ` (${prof[0].toString(16)})${BREAK}`;

	res += "constraints=";
	for (let i = 0; i <= 5; i++) res += AVCconstraint(prof[1], i) ? i : "-";
	res += BREAK;

	res += "level=";
	switch (prof[2]) {
		case 0x0a:
			coding_params.level = "1";
			res += coding_params.level;
			break;
		case 0x0b:
			coding_params.level = AVCconstraint(prof[1], 3) ? "1b" : "1.1";
			res += coding_params.level;
			break;
		case 0x0c:
			coding_params.level = "1.2";
			res += coding_params.level;
			break;
		case 0x1d:
			coding_params.level = "1.3";
			res += coding_params.level;
			break;
		case 0x14:
			coding_params.level = "2";
			res += coding_params.level;
			break;
		case 0x15:
			coding_params.level = "2.1";
			res += coding_params.level;
			break;
		case 0x16:
			coding_params.level = "2.2";
			res += coding_params.level;
			break;
		case 0x1e:
			coding_params.level = "3";
			res += coding_params.level;
			break;
		case 0x1f:
			coding_params.level = "3.1";
			res += coding_params.level;
			break;
		case 0x20:
			coding_params.level = "3.2";
			res += coding_params.level;
			break;
		case 0x28:
			coding_params.level = "4";
			res += coding_params.level;
			break;
		case 0x29:
			coding_params.level = "4.1";
			res += coding_params.level;
			break;
		case 0x2a:
			coding_params.level = "4.2";
			res += coding_params.level;
			break;
		case 0x32:
			coding_params.level = "5";
			res += coding_params.level;
			break;
		case 0x33:
			coding_params.level = "5.1";
			res += coding_params.level;
			break;
		case 0x34:
			coding_params.level = "5.2";
			res += coding_params.level;
			break;
		case 0x3c:
			coding_params.level = "6";
			res += coding_params.level;
			break;
		case 0x3d:
			coding_params.level = "6.1";
			res += coding_params.level;
			break;
		case 0x3f:
			coding_params.level = "6.2";
			res += coding_params.level;
			break;
		default:
			coding_params.level = "invalid";
			res += err("undefined");
	}
	res += ` (${prof[2].toString(16)})${BREAK}`;

	let dvb = DVBclassification(coding_params);
	if (dvb.length != 0) res += BREAK + bold("DVB term: ") + dvb + BREAK;

	return res;
}

addHandler(["avc1", "avc2", "avc3", "avc4"], "AVC/H.264", decodeAVC);
addHandler(["mvc1", "mvc2"], "Multiview Coding", decodeAVC);
addHandler("svc1", "Scalable Video Coding", decodeAVC);
