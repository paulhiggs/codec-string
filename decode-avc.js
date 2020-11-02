/**
 * https://blog.pearce.org.nz/2013/11/what-does-h264avc1-codecs-parameters.html
 * https://en.wikipedia.org/wiki/Advanced_Video_Coding
 **/
function decodeAVC(val) {

	function AVCconstraint(val, constraint) {
		// constraint 012345--
		// bit        76543210	
		if (constraint<0 || constraint>5) return false;
		return (val & Math.pow(2, 7-constraint))?true:false	
	}

	var parts=val.split(".")
	let res=""
	
	if (parts.length!=2)
		return err("invalid format")+BREAK
	
	if (parts[1].length!=6) 
		return err("invalid parameters length ("+parts[1].length+") - should be 6")+BREAK
	
	if (!hexDigits(parts[1])) 
		return err("parameters contains non-hex digits")+BREAK	
	
	let prof=sscanf(parts[1], "%2x%2x%2x")	
	res+="profile_idc="+prof[0]+" constraint_set="+prof[1]+" level_idc="+prof[2]+BREAK
	
	res+="profile="
	switch (prof[0]) {
		case 0x2c: res+="CAVLC 4:4:4"; break
		case 0x42: res+=(AVCconstraint(prof[1], 1)?"Constrained ":"")+"Baseline"; break
		case 0x4d: res+=(AVCconstraint(prof[1], 1)?"Constrained ":"")+"Main"; break
		case 0x53: res+="Scalable "+(AVCconstraint(prof[1], 5)?"Constrained ":""+"Base"); break
		case 0x56: res+="Scalable "
			if (!AVCconstraint(prof[1], 3) && AVCconstraint(prof[1], 5)) res+="Constrained "
			if (AVCconstraint(prof[1], 3) && !AVCconstraint(prof[1], 5)) res+="Intra "
			res+="High"; break
		case 0x58: res+="Extended"; break
		case 0x63: res+="High 10"+(AVCconstraint(prof[1], 3)?" Intra":""); break
		case 0x64: 
			if (AVCconstraint(prof[1], 4) && !AVCconstraint(prof[1], 5))
				res+="Progressive "
			if (!AVCconstraint(prof[1], 4) && AVCconstraint(prof[1], 5))
				res+="Constrained "	
			res+="High"; break
		case 0x76: res+="Multiview High"; break
		case 0x7a: res+="High 4:2:2"+(AVCconstraint(prof[1], 3)?" Intra":""); break
		case 0x80: res+="Stereo High"; break
		case 0x86: res+="MFC High"; break
		case 0x87: res+="MFC Depth High"; break
		case 0x8a: res+="Multiview Depth High High"; break
		case 0x8b: res+="Enhanced Multiview Depth High High"; break
		case 0xf4: res+="High 4:4:4 "+(AVCconstraint(prof[1], 3)?" Intra":" Predictive"); break
		default:
			res+=err("unknown")					
	}
	res+=" ("+prof[0].toString(16)+")"+BREAK
	
	res+="constraints="
	for (var i=0; i<=5; i++)
		res+=(AVCconstraint(prof[1], i)?i:"-")
	res+=BREAK
	
	res+="level="
	switch (prof[2]) {
		case 10: res+="1"; break
		case 11: res+=(AVCconstraint(prof[1], 3)?"1b":"1.1"); break
		case 12: res+="1.2"; break
		case 13: res+="1.3"; break
		case 20: res+="2"; break
		case 21: res+="2.1"; break
		case 22: res+="2.2"; break
		case 30: res+="3"; break
		case 31: res+="3.1"; break
		case 32: res+="3.2"; break
		case 40: res+="4"; break
		case 41: res+="4.1"; break
		case 42: res+="4.2"; break
		case 50: res+="5"; break
		case 51: res+="5.1"; break
		case 52: res+="5.2"; break
		case 60: res+="6"; break
		case 61: res+="6.1"; break
		case 62: res+="6.2"; break
		default: res+=err("undefined");
	}
	res+=" ("+prof[2].toString(16)+")"+BREAK

	return res;
}

addHandler("avc1", "AVC/H.264", decodeAVC)
addHandler("avc3", "AVC/H.264", decodeAVC)