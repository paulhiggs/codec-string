function decodeAV1(val) {

	// defined in https://aomediacodec.github.io/av1-isobmff/#codecsparam
	
	var parts=val.split(".")
	if (parts.length!=4)
		return err("invalid format")

	let res=""
	
	switch (parts[1]) {
		case "0": res+="Main Profile"; break
		case "1": res+="High Profile"; break
		case "2": res+="Professional Profile"; break
		default: res+=err("unknown profile ("+parts[1]+")")
	}
	res+=BREAK
	
	levelAndTier=sscanf(parts[2], "%d%c")
	res+="Level "
	switch (levelAndTier[0]) {
		case 0: res+="2.0"; break
		case 1: res+="2.1"; break
		case 2: res+="2.2"; break
		case 3: res+="2.3"; break
		case 4: res+="3.0"; break
		case 5: res+="3.1"; break
		case 6: res+="3.2"; break
		case 7: res+="3.3"; break
		case 8: res+="4.0"; break
		case 9: res+="4.1"; break
		case 10: res+="4.2"; break
		case 11: res+="4.3"; break
		case 12: res+="5.0"; break
		case 13: res+="5.1"; break
		case 14: res+="5.2"; break
		case 15: res+="5.3"; break
		case 16: res+="6.0"; break
		case 17: res+="6.1"; break
		case 18: res+="6.2"; break
		case 19: res+="6.3"; break
		case 20: res+="7.0"; break
		case 21: res+="7.1"; break
		case 22: res+="7.2"; break
		case 23: res+="7.3"; break
		case 31: res+="Max"; break
		default: res+=err("unknown ("+levelAndTier[0]+")")
	}
	res+=BREAK
	switch (levelAndTier[1].toUpperCase()) {
		case "M":
			res+="Main tier"; break
		case "H":
			res+="High tier"; break
		default:
			res+=err("unknown tier ("+levelAndTier[1]+")")
	}	
	res+=BREAK
	switch (parts[3]) {
		case "08": res+="8 bit"; break
		case "10": res+="10 bit"; break
		case "12": res+="12 bit"; break
		default: res+=err("unknown bit depth ("+parts[3]+")")
	}
	
	return res
}

addHandler("av01", "AV1", decodeAV1)