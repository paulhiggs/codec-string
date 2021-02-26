
// see annex E.6 through E.8 of  ISO/IEC 14496-15:2019 Amd.2 "Carriage of VVC and EVC in ISOBMFF"
// w19454

function decodeVVC(val) {

    let VVCregex=/^(vvc1)\.\d+\.([LH]\d+)(\.C[a-fA-F\d]{1,2})?(\.S[a-fA-F\d]{1,2}(\+[a-fA-F\d]{1,2})*)?(\.O\d+(\+\d+)?)?$/
  

    return "valid="+VVCregex.test(val)
}

addHandler("vvc1", "MPEG Versatile Video Coding", decodeVVC)
addHandler("vvcN", "VVC non-VCL track", noHandler)
addHandler("vvs1", "VVC subpicture track", noHandler)