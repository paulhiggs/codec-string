/*jshint esversion: 6 */

 function decodeAVS3(val) {

	 let parts=val.split(".");
	 if (parts.length != 3)
	 	return err("AVS3 codec requires 3 parts")+BREAK;

	let argErrs="";
	if (!hexDigits(parts[1]))
		 argErrs+=err(`profile_id not expressed in hexadecimal (${parts[1]})`)+BREAK;
	if (!hexDigits(parts[2]))
		 argErrs+=err(`level_id not expressed in hexadecimal (${parts[2]})`)+BREAK;

	if (argErrs.length)
		return argErrs;

	let profile_id=parseInt(parts[1], 16), level_id=parseInt(parts[2], 16);
	let res="";

	switch (profile_id) {
		case 0x20: res+="Main 8-bit profile"; break;
		case 0x22: res+="Main 10-bit profile"; break;
		case 0x30: res+="High 8-bit profile"; break;
		case 0x32: res+="High 10-bit profile"; break;
		default: res+=err(`invalid profile_id (${parts[1]}) specified`);
	}
	res+=BREAK;

	let lev="";
	switch (level_id) {
		case 0x00: res+=warn('forbidden'); break;
		case 0x10: lev="2.0.15"; break;
		case 0x12: lev="2.0.30"; break;
		case 0x14: lev="2.0.60"; break;
		case 0x20: lev="4.0.30"; break;
		case 0x22: lev="4.0.60"; break;
		case 0x40: lev="6.0.30"; break;
		case 0x42: lev="6.2.30"; break;
		case 0x44: lev="6.4.30"; break;
		case 0x43: lev="6.6.30"; break;
		case 0x44: lev="6.0.60"; break;
		case 0x46: lev="6.2.60"; break;
		case 0x45: lev="6.4.60"; break;
		case 0x47: lev="6.6.60"; break;
		case 0x48: lev="6.0.120"; break;
		case 0x4a: lev="6.2.120"; break;
		case 0x49: lev="6.4.120"; break;
		case 0x4b: lev="6.6.120"; break;
		case 0x50: lev="8.0.30"; break;
		case 0x52: lev="8.2.30"; break;
		case 0x51: lev="8.4.30"; break;
		case 0x53: lev="8.6.30"; break;
		case 0x54: lev="8.0.60"; break;
		case 0x56: lev="8.2.60"; break;
		case 0x55: lev="8.4.60"; break;
		case 0x57: lev="8.6.60"; break;
		case 0x58: lev="8.0.120"; break;
		case 0x5a: lev="8.2.120"; break;
		case 0x59: lev="8.4.120"; break;
		case 0x5b: lev="8.6.120"; break;
		case 0x60: lev="10.0.30"; break;
		case 0x62: lev="10.2.30"; break;
		case 0x61: lev="10.4.30"; break;
		case 0x63: lev="10.6.30"; break;
		case 0x64: lev="10.0.60"; break;
		case 0x66: lev="10.2.60"; break;
		case 0x65: lev="10.4.60"; break;
		case 0x67: lev="10.6.60"; break;
		case 0x68: lev="10.0.120"; break;
		case 0x6a: lev="10.2.120"; break;
		case 0x69: lev="10.4.120"; break;
		case 0x6b: lev="10.6.120"; break;
		default: res+=err(`invalid level_id (${parts[2]}) specified`);
	}
	if (lev) res+=`Level ${lev}`;
	res+=BREAK;

	return res+BREAK;
 }

 addHandler(["av3e"], "AVS3 Video", decodeAVS3);