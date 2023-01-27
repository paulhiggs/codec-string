/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-ac4.js
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
 * ETSI TS 103-190-2 annex E.13 - https://www.etsi.org/deliver/etsi_ts/103100_103199/10319002/01.02.01_60/ts_10319002v010201p.pdf

 **/
 
function decodeAC4(val) {

	let res="", parts=val.split(".");
	
	if (parts.length!=4)
		return err("invalid format")+BREAK;

	if (!hexDigits(parts[1]) || !hexDigits(parts[2]) || !hexDigits(parts[3])) 
		return err("parameters contain non-hex digits")+BREAK;	

	res+=`bitstream_version: ${parseInt(parts[1],16)}${BREAK}presentation_version: ${parseInt(parts[2],16)}${BREAK}`;

	res+="maximum channels: ";
	switch (parseInt(parts[3],16)) {
		case 0: res+="2"; break;
		case 1: res+="6"; break;
		case 2: res+="9"; break;
		case 3: res+="11"; break;
		case 4: res+="13"; break;
		case 5:
		case 6:
			res+=warn("Reserved"); break;
		case 7: res+="Unrestricted"; break;
		default: res+=err(`invalid value (${parseInt(parts[3],16)})`);
	}
	res+=BREAK;
	return res;
}

addHandler("ac-4", "Digital Audio Compression (AC-4)", decodeAC4); 