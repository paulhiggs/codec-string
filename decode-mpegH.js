/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-mpegH.js
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
// see ISO/IEC 23000-19:2019 Amd.2 "CMAF Media Profiles for MPEG-H 3D Audio, EVC, VVC and other technologies"
// MDS19970_WG03_N00137

function decodeMPEGH(val) {

	const MHAregex = /^(mhm1|mhm2)\.0x[a-fA-F\d]{2}$/;

    var parts=val.split(".");

	if (parts.length!=2) 
		return err("MPEG-H audio requires 2 parts")+BREAK;

    let res="";
    let level=parseInt(parts[1], 16);

    switch (level[0]) {
        case 0x0b: res+="LC Profile Level 1"; break;
        case 0x0c: res+="LC Profile Level 2"; break;
        case 0x0d: res+="LC Profile Level 3"; break;
        case 0x10: res+="BL Profile Level 1"; break;
        case 0x11: res+="BL Profile Level 2"; break;
        case 0x12: res+="BL Profile Level 3"; break;
        default: return err('invalid level')+BREAK;
    }
    if (parts[0]=="mhm2")
        res+=", multi-steam";

    return res+BREAK;
}

addHandler(["mhm1", "mhm2"], "MPEG-H Audio", decodeMPEGH);
