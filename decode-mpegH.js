
// see ISO/IEC 23000-19:2019 Amd.2 "CMAF Media Profiles for MPEG-H 3D Audio, EVC, VVC and other technologies"
// MDS19970_WG03_N00137

function decodeMPEGH(val) {

	const MHAregex = /^(mhm1|mhm2)\.0x[a-fA-F\d]{2}$/


    var parts=val.split(".")

	if (parts.length!=2) 
		return err("MPEG-H audio requires 2 parts")+BREAK

    let res=""
    let level=sscanf(parts[1], "%x")

    switch (level[0]) {
        case 0x0b: res+="LC Profile Level 1"; break
        case 0x0c: res+="LC Profile Level 2"; break
        case 0x0d: res+="LC Profile Level 3"; break
        case 0x10: res+="BL Profile Level 1"; break
        case 0x11: res+="BL Profile Level 2"; break
        case 0x12: res+="BL Profile Level 3"; break
        default: res+=err('invalid level')
    }
    if (parts[0]=="mhm2")
        res+=", multi-steam"

    return res+BREAK
}

addHandler(["mhm1", "mhm2"], "MPEG-H Audio", decodeMPEGH)
