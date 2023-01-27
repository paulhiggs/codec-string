/**
 * @copyright: Copyright (c) 2021-2023
 * @author: Paul Higgs
 * @file: decode-hevc.js
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
function decodeHEVC(val) {

	// regex from DVB TM-STREAM0087: /(hev1|hvc1)\.[a-zA-Z]?\d{1,3}\.[a-fa-F\d]{1,8}\.[LH]\d{1,3}/
	// but needs to include the 6 btyes from the decoder constraint flags
	
	const HEVCregex = /^(hev1|hvc1)\.[a-zA-Z]?\d{1,3}\.[a-fA-F\d]{1,8}\.[LH]\d{1,3}(\.[a-fA-F\d]{1,2}){,6}$/;

	function HEVCprofile(general_profile_idc, cap, gopocf) {
		if (general_profile_idc==1 || bitSet32(cap,1)) return "Main (1)";
		if (general_profile_idc==2 || bitSet32(cap,2)) return `Main 10 ${gopocf?"Still Picture ":""}(2)`;
		if (general_profile_idc==3 || bitSet32(cap,3)) return "Main Still Picture (3)";
		if (general_profile_idc==4 || bitSet32(cap,4)) return "Range Extensions (4)";
		if (general_profile_idc==5 || bitSet32(cap,5)) return "High Throughput (5)";
		if (general_profile_idc==9 || bitSet32(cap,9)) return "Screen Content Coding (9)";
		if (general_profile_idc==11 || bitSet32(cap,11)) return "High Throughput Screen Content Coding (11)";
		return err("unknown");
	}

	function showbit(v) {return v?"1":"0";}

	let parts=val.split(".");

	if (parts.length<5) 
		return err("HEVC codec requires at least 5 parts")+BREAK;

	let argErr="", res="";
	
	if (!hexDigits(parts[2]))
		argErr+=err(`general_profile_compatibility_flag not expressed in hexadecimal (${parts[2]})`)+BREAK;
 
	let general_profile_compatibility_flag=parseInt(parts[2], 16);
	let general_profile_idc=-1, general_profile_space=-1;
	
	if (parts[1][0]=="A" || parts[1][0]=="B" || parts[1][0]=="C") {
		let gp=sscanf(parts[1], "%c%d");
		switch (gp[0].toUpperCase()) {
			case "A": general_profile_space=1; break;
			case "B": general_profile_space=2; break;
			case "C": general_profile_space=3; break;
		}
		general_profile_idc=gp[1];
	}
	else {
		general_profile_space=0;
		general_profile_idc=parseInt(parts[1]);
	}
 
	// process the constraints as we need to extract the general_one_picture_only_constraint_flag

	let constraintFlags=new BitList();
	let i=4, constraints="", general_one_picture_only_constraint_flag=0	;
	while (i<10) {
		let bFlags=0;
		if (parts[i]) {
			if (!hexDigits(parts[i])) 
				argErr+=err(`constraint flags not specified in hexadecimal (${parts[i]})`)+BREAK;
			else
				bFlags=parseInt(parts[i].toLowerCase(), 16);
		}
		constraintFlags.push(bFlags);
		i++;
	}	

	if (argErr.length)
		return argErr;

	constraints+=`<i>constraintFlags=${constraintFlags.toString()}</i>${BREAK}`;
	
	let general_progressive_source_flag=constraintFlags.bitset(48),
		general_interlaced_source_flag=constraintFlags.bitset(47);
			
	if (general_progressive_source_flag && !general_interlaced_source_flag)
		constraints+="scan=progressive";
	else if (!general_progressive_source_flag && general_interlaced_source_flag)
		constraints+="scan=interlaced";
	else if (general_progressive_source_flag && general_interlaced_source_flag)
		constraints+="scan=source_scan_type in SEI";
	else 
		constraints+=err("scan=unknown or unspecified");
	constraints+=BREAK;
	
	constraints+=`general_non_packed_constraint_flag=${showbit(constraintFlags.bitset(46))}${BREAK}`;
	constraints+=`general_frame_only_constraint_flag=${showbit(constraintFlags.bitset(45))}${BREAK}`;
	
	if (general_profile_idc==4 || bitSet32(general_profile_compatibility_flag, 4) ||
		general_profile_idc==5 || bitSet32(general_profile_compatibility_flag, 5) ||
		general_profile_idc==6 || bitSet32(general_profile_compatibility_flag, 6) ||
		general_profile_idc==7 || bitSet32(general_profile_compatibility_flag, 7) ||
		general_profile_idc==8 || bitSet32(general_profile_compatibility_flag, 8) ||
		general_profile_idc==9 || bitSet32(general_profile_compatibility_flag, 9) ||
		general_profile_idc==10 || bitSet32(general_profile_compatibility_flag, 10) ||
		general_profile_idc==11 || bitSet32(general_profile_compatibility_flag, 11) ) {
			
		constraints+=`general_max_12bit_constraint_flag=${showbit(constraintFlags.bitset(44))}${BREAK}`;
		constraints+=`general_max_10bit_constraint_flag=${showbit(constraintFlags.bitset(43))}${BREAK}`;
		constraints+=`general_max_8bit_constraint_flag=${showbit(constraintFlags.bitset(42))}${BREAK}`;
		constraints+=`general_max_422chroma_constraint_flag=${showbit(constraintFlags.bitset(41))}${BREAK}`;
		constraints+=`general_max_420chroma_constraint_flag=${showbit(constraintFlags.bitset(40))}${BREAK}`;
		constraints+=`general_max_monochrome_constraint_flag=${showbit(constraintFlags.bitset(39))}${BREAK}`;
		constraints+=`general_intra_constraint_flag=${showbit(constraintFlags.bitset(38))}${BREAK}`;
		constraints+=`general_one_picture_only_constraint_flag="${showbit(constraintFlags.bitset(37))}${BREAK}`;
		general_one_picture_only_constraint_flag=constraintFlags.bitset(37);
		constraints+=`general_lower_bit_rate_constraint_flag=${showbit(constraintFlags.bitset(36))}${BREAK}`;
		
		if (general_profile_idc==5 || bitSet32(general_profile_compatibility_flag, 5) ||
			general_profile_idc==9 || bitSet32(general_profile_compatibility_flag, 9) ||
			general_profile_idc==10 || bitSet32(general_profile_compatibility_flag, 10) ||
			general_profile_idc==11 || bitSet32(general_profile_compatibility_flag, 11)) {
			
			constraints+=`general_max_12bit_constraint_flag=${showbit(constraintFlags.bitset(35))}${BREAK}`;
			// general_reserved_zero_33bits
		}
		else {
			// general_reserved_zero_34bits
		}
	}
	else if (general_profile_idc==2 || bitSet32(general_profile_compatibility_flag, 2)) {
	
		// general_reserved_zero_7bits
		constraints+=`general_one_picture_only_constraint_flag=${showbit(constraintFlags.bitset(37))}${BREAK}`;
		general_one_picture_only_constraint_flag=constraintFlags.bitset(37);
		//general_reserved_zero_35bits
	}
	else {
		// general_reserved_zero_43bits
	}
	
	if (general_profile_idc==1 || bitSet32(general_profile_compatibility_flag, 1) ||
	    general_profile_idc==2 || bitSet32(general_profile_compatibility_flag, 2) ||
	    general_profile_idc==3 || bitSet32(general_profile_compatibility_flag, 3) ||
	    general_profile_idc==4 || bitSet32(general_profile_compatibility_flag, 4) ||
	    general_profile_idc==5 || bitSet32(general_profile_compatibility_flag, 5) ||
	    general_profile_idc==9 || bitSet32(general_profile_compatibility_flag, 9) ||
	    general_profile_idc==11 || bitSet32(general_profile_compatibility_flag, 11) ) {
		
		constraints+=`general_inbld_flag=${showbit(constraintFlags.bitset(1))}${BREAK}`;
	}
	else {
		// general_reserved_zero_bit
	}

	res+=`general_profile_space=${general_profile_space==-1?err(general_profile_space):general_profile_space}${BREAK}`;
	res+=`general_profile_idc=${HEVCprofile(general_profile_idc, general_profile_compatibility_flag, general_one_picture_only_constraint_flag)}${BREAK}`;
		
	let tier=sscanf(parts[3], "%c%d");
	switch (tier[0].toUpperCase()) {
		case "L": res+="Main Tier (L)"; break;
		case "H": res+="High Tier (H)"; break;
		default: res+=err(`unknown Tier (${tier[0]})`); break;
	}
	res+=" ";
	let lev=null;
	switch (tier[1]) {
		case 30: lev="1"; break;
		case 60: lev="2"; break;
		case 63: lev="2.1"; break;
		case 90: lev="3"; break;
		case 93: lev="3.1"; break;
		case 120: lev="4"; break;
		case 123: lev="4.1"; break;
		case 150: lev="5"; break;
		case 153: lev="5.1"; break;
		case 156: lev="5.2"; break;
		case 180: lev="6"; break;
		case 183: lev="6.1"; break;
		case 186: lev="6.2"; break;
		default: res+=err(`unknown Level (${tier[1]})`);
	}
	if (lev) res+=`Level ${lev}`;
	res+=BREAK;
	
	return res+constraints;
}

addHandler(["hev1", "hvc1"], "HEVC/H.265", decodeHEVC);