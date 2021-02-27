
// see annex E.6 through E.8 of  ISO/IEC 14496-15:2019 Amd.2 "Carriage of VVC and EVC in ISOBMFF"
// w19454

// VVC - ISO/IEC 23090-3  - w19470

function decodeVVC(val) {

    function printProfile(profile) {
        let res="", general_profile_idc=sscanf(profile, "%d")[0]

        switch (general_profile_idc) {
            case 1: res+="Main 10"; break
            case 65: res+="Main 10 Still Picture"; break
            case 33: res+="Main 10 4:4:4"; break
            case 97: res+="Main 10 4:4:4 Still Picture"; break
            case 17: res+="Multilayer Main 10"; break
            case 49: res+="Multilayer Main 10 4:4:4"; break
        }

        return res+BREAK
    }

    function printTier(tier, level) {
        let res="", op_level_idc=sscanf(level, "%d")[0]

        switch (tier) {
            case "L": res+="Main Tier (L)"; break
            case "H": res+="High Tier (H)"; break
            default: res+=err("unknown Tier ("+tier[0]+")"); break
        }
        res+=BREAK
        let lev=null
        switch (op_level_idc) {
            // table 135 in VVC
            case 16: lev="1.0"; break
            case 32: lev="2.0"; break
            case 35: lev="2.1"; break
            case 48: lev="3.0"; break
            case 51: lev="3.1"; break
            case 64: lev="4.0"; break
            case 67: lev="4.1"; break
            case 80: lev="5.0"; break
            case 83: lev="5.1"; break
            case 86: lev="5.2"; break
            case 96: lev="6.0"; break
            case 99: lev="6.1"; break
            case 102: lev="6.2"; break
            default: res+=err("unknown Level ("+tier[1]+")")
        }
        if (lev) res+="Level "+lev
        return res+=BREAK
    }


    function printConstraints(general_constraint_info) {
        let res="" 
        res+="Constraints="+unprocessed(general_constraint_info)     
        return res+=BREAK
    }

    function printSubProfile(general_sub_profile_idc) {
        let res=""
        let i=1, subProfiles=general_sub_profile_idc.split("+")

        // VVC says
        //general_sub_profile_idc[ i ] specifies the i-th interoperability indicator registered as specified by Rec. ITU-T T.35, 
        // the contents of which are not specified in this document.
        // ITU T.35 (2000) - Procedure for the allocation of ITU-T defined codes for non-standard facilities

        subProfiles.forEach(profile => {
            let p=parseInt(profile, 16)
            res+="Sub profile ("+ i++ + ")="+p+BREAK
        })
        return res
    }

    function printTemporalLayers(indexes) {
        let res=""
        let layerIndexes=indexes.split("+")
        if (layerIndexes[0]) {
            res+="Output Layer Set index (<em>OlsIdx</em>)="+layerIndexes[0]+BREAK
        }
        if (layerIndexes[1]) {
            res+="Maximum Temporal Id (<em>MaxTid</em>)="+layerIndexes[1]+BREAK            
        }
        return res
    }
    let VVCregex=/^(vvc1|vvi1)(\.\d+)(\.[LH]\d+)(\.C[a-fA-F\d]{1,2})?(\.S[a-fA-F\d]{1,2}(\+[a-fA-F\d]{1,2})*)?(\.O\d+(\+\d+)?)?$/

    if (!VVCregex.test(val))
        return err('Regex mismatch!')

    let x=val.match(VVCregex)
    var res=""
    x.forEach(part=>{
        if (part && part.substring(0,1)==".") {
            
            let cmd=part.substring(1,2)
            if (cmd>="0" && cmd<="9") {
                res+=printProfile(part.substring(1))
            }
            else switch (cmd) {
                case 'L':
                    res+=printTier('L', part.substring(2))
                    break
                case 'H':
                    res+=printTier('H', part.substring(2))
                    break
                case 'C':
                    res+=printConstraints(part.substring(2))
                    break
                case 'S':
                    res+=printSubProfile(part.substring(2))
                    break
                case 'O':
                    res+=printTemporalLayers(part.substring(2))
                    break
            }
        }
    })

    return res
}

addHandler(["vvc1","vvi1"], "MPEG Versatile Video Coding", decodeVVC)
addHandler("vvcN", "VVC non-VCL track", noHandler)
addHandler("vvs1", "VVC subpicture track", noHandler)