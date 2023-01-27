/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-av1.js
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
function decodeAV1(val) {

	// defined in https://aomediacodec.github.io/av1-isobmff/#codecsparam
	/* 
		<sample entry 4CC>.<profile>.<level><tier>.<bitDepth>.<monochrome>.<chromaSubsampling>.
		<colorPrimaries>.<transferCharacteristics>.<matrixCoefficients>.<videoFullRangeFlag>
	 */
	var parts=val.split(".");
	if (parts.length<4)
		return err("invalid format");

	let res="";
	
	switch (parts[1]) {
		case "0": res+="Main Profile"; break;
		case "1": res+="High Profile"; break;
		case "2": res+="Professional Profile"; break;
		default: res+=err(`unknown profile (${parts[1]})`);
	}
	res+=BREAK;
	
	let levelAndTier=sscanf(parts[2], "%d%c");
	res+="Level ";
	switch (levelAndTier[0]) {
		case 0: res+="2.0"; break;
		case 1: res+="2.1"; break;
		case 2: res+="2.2"; break;
		case 3: res+="2.3"; break;
		case 4: res+="3.0"; break;
		case 5: res+="3.1"; break;
		case 6: res+="3.2"; break;
		case 7: res+="3.3"; break;
		case 8: res+="4.0"; break;
		case 9: res+="4.1"; break;
		case 10: res+="4.2"; break;
		case 11: res+="4.3"; break;
		case 12: res+="5.0"; break;
		case 13: res+="5.1"; break;
		case 14: res+="5.2"; break;
		case 15: res+="5.3"; break;
		case 16: res+="6.0"; break;
		case 17: res+="6.1"; break;
		case 18: res+="6.2"; break;
		case 19: res+="6.3"; break;
		case 20: res+="7.0"; break;
		case 21: res+="7.1"; break;
		case 22: res+="7.2"; break;
		case 23: res+="7.3"; break;
		case 24:
		case 25:
		case 26:
		case 27:
		case 28:
		case 29:
		case 30:
			res+=warn(`reserved level ${levelAndTier[0]}`);
			break;		
		case 31: res+="Max"; break;
		default: res+=err(`unknown (${levelAndTier[0]})`);
	}
	res+=BREAK;
	switch (levelAndTier[1].toUpperCase()) {
		case "M": res+="Main tier"; break;
		case "H": res+="High tier"; break;
		default: res+=err(`unknown tier (${levelAndTier[1]})`);
	}	
	res+=BREAK;
	switch (parts[3]) {
		case "08": res+="8 bit"; break;
		case "10": res+="10 bit"; break;
		case "12": res+="12 bit"; break;
		default: res+=err(`unknown bit depth (${parts[3]})`);
	}

	res+=BREAK;
	if (parts.length>4)
		switch (parts[4]) {
			case '0': res+='Contains Y, U and V (colour)'; break;
			case '1': res+='No U or V (monochrome)'; break;
			default: res+=err(`unknown mono_chrome (${parts[4]})`);
		}
	else res+=dflt('0 Colour');

	res+=BREAK;
	if (parts.length>5) 
		if (parts[5].length!=3)
			res+=err(`incorrect subsampling length ${parts[5]}`);
		else {
			switch (parts[5][0]) {
				case '0': break;
				case '1': break;
				default: res+=err(`invalid value for subsampling_x (${parts[5][0]})`);
			}
			switch (parts[5][1]) {
				case '0': break;
				case '1': break;
				default: res+=err(`invalid value for subsampling_y (${parts[5][1]})`);
			}
			switch (parts[5][2]) {
				case '0': res+='CSP_UNKNOWN'; break;
				case '1': res+='CSP_VERTICAL'; break;
				case '2': res+='CSP_COLOCATED'; break;
				case '3': res+=warn('CSP_RESERVED'); break;
				default: res+=err(`invalid value for subsampling_y (${parts[5][2]})`);
			}
			if (parts[5][0]!='1' || parts[5][1]!='1')
				if (parts[5][2] != '0')
					res+=err('third digit must be 0 when first or second digit are not set to 1');
		}
	else res+=dflt('110 4:2:0');
	

	res+=BREAK;
	if (parts.length>6)
		switch (parseInt(parts[6])) {
			case 1: res+='CP_BT_709 - BT.709'; break;
			case 2: res+='CP_UNSPECIFIED - Unspecified colour primaries'; break;
			case 4: res+='CP_BT_470_M - BT.470 System M (historical)'; break;
			case 5: res+='CP_BT_470_B_G - BT.470 System B, G (historical)'; break;
			case 6: res+='CP_BT_601 - BT.601'; break;
			case 7: res+='CP_SMPTE_240 - SMPTE 240'; break;
			case 8: res+='CP_GENERIC_FILM - Generic film (color filters using illuminant C)'; break;
			case 9: res+='CP_BT_2020 - BT.2020, BT.2100'; break;
			case 10: res+='CP_XYZ - SMPTE 428 (CIE 1921 XYZ)'; break;
			case 11: res+='CP_SMPTE_431 - SMPTE RP 431-2'; break;
			case 12: res+='CP_SMPTE_432 - SMPTE EG 432-1'; break;
			case 22: res+='CP_EBU_3213 - EBU Tech. 3213-E'; break;
			default: res+=err(`unknown value for color_primaries (${parts[6]})`);
		}
	else res+=dflt('1 (ITU-R BT.709)');

	res+=BREAK;
	if (parts.length>7) 
		switch (parseInt(parts[7])) {
			case 0: res=+warn(`TC_RESERVED_0 - For future use`); break;
			case 1: res+='TC_BT_709 - BT.709'; break;
			case 2: res+='TC_UNSPECIFIED - Unspecified'; break;
			case 3: res+=warn('TC_RESERVED_3 - For future use'); break;
			case 4: res+='TC_BT_470_M - BT.470 System M (historical)'; break;
			case 5: res+='TC_BT_470_B_G - BT.470 System B, G (historical)'; break;
			case 6: res+='TC_BT_601 - BT.601'; break;
			case 7: res+='TC_SMPTE_240 - SMPTE 240 M'; break;
			case 8: res+='TC_LINEAR - Linear'; break;
			case 9: res+='TC_LOG_100 - Logarithmic (100 : 1 range)'; break;
			case 10: res+='TC_LOG_100_SQRT10 - Logarithmic (100 * Sqrt(10) : 1 range)'; break;
			case 11: res+='TC_IEC_61966 - IEC 61966-2-4'; break;
			case 12: res+='TC_BT_1361 - BT.1361'; break;
			case 13: res+='TC_SRGB - sRGB or sYCC'; break;
			case 14: res+='TC_BT_2020_10_BIT - BT.2020 10-bit systems'; break;
			case 15: res+='TC_BT_2020_12_BIT - BT.2020 12-bit systems'; break;
			case 16: res+='TC_SMPTE_2084 - SMPTE ST 2084, ITU BT.2100 PQ'; break;
			case 17: res+='TC_SMPTE_428 - SMPTE ST 428'; break;
			case 18: res+='TC_HLG - BT.2100 HLG, ARIB STD-B67'; break;
			default: res+=err(`unknown value for transfer_characteristics (${parts[7]})`);
		}
	else res+=dflt('1 (ITU-R BT.709)');

	res+=BREAK;
	if (parts.length>8)
		switch(parseInt(parts[8])) {
			case 0: res+='MC_IDENTITY - Identity matrix'; break;
			case 1: res+='MC_BT_709 - BT.709'; break;
			case 2: res+='MC_UNSPECIFIED - Unspecified'; break;
			case 3: res+=err('MC_RESERVED_3 - r future use'); break;
			case 4: res+='MC_FCC - US FCC 73.628'; break;
			case 5: res+='MC_BT_470_B_G - BT.470 System B, G (historical)'; break;
			case 6: res+='MC_BT_601 - BT.601'; break;
			case 7: res+='MC_SMPTE_240 - SMPTE 240 M'; break;
			case 8: res+='MC_SMPTE_YCGCO - YCgCo'; break;
			case 9: res+='MC_BT_2020_NCL - BT.2020 non-constant luminance, BT.2100 YCbCr'; break;
			case 10: res+='MC_BT_2020_CL - BT.2020 constant luminance'; break;
			case 11: res+='MC_SMPTE_2085 - SMPTE ST 2085 YDzDx'; break;
			case 12: res+='MC_CHROMAT_NCL - Chromaticity-derived non-constant luminance'; break;
			case 13: res+='MC_CHROMAT_CL - Chromaticity-derived constant luminance'; break;
			case 14: res+='MC_ICTCP BT.2100 - ICtCp'; break;
			default: res+=err(`unknown value for marrix_coefficients (${parts[8]})`); 
		}
	else res+=dflt('1 (ITU-R BT.709)');

	res+=BREAK;
	if (parts.length>9) {
		switch (parts[9]) {
			case '0': res+='0 (studio swing representation)'; break;
			case '1': res+='1 (full swing representation)'; break;
			default: res+=err(`unknown value for video_full_range (${parts[9]})`);
		}
	}
	else res+=dflt('0 (studio swing representation)');
	return res;
}

addHandler("av01", "AV1", decodeAV1);