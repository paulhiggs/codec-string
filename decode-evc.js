
// see annex E.9 of  ISO/IEC 14496-15:2019 Amd.2 "Carriage of VVC and EVC in ISOBMFF" (w19454)
// and ISO/IEC 23091-2 (MDS19669_WG05_N00011)

function ISOIEC23091_2_ColourPrimaries(value) {
    if (value > 255)
        return [err('invalid value ('+value+')')]
    switch (value) {
        case 1:  return [
                    "Rec. ITU-R BT.709-6",
                    "Rec. ITU-R BT.1361-0 conventional colour gamut system and extended colour gamut system (historical)",
                    "IEC 61966-2-1 sRGB or sYCC",
                    "IEC 61966-2-4",
                    "Society of Motion Picture and Television Engineers RP 177 (1993) Annex B" ]
        case 2:  return [title("Unspecified")]
        case 4:  return [
                    "Rec. ITU-R BT.470-6 System M (historical)",
                    "United States National Television System Committee 1953 Recommendation for transmission standards for colour television",
                    "United States Federal Communications Commission Title 47 Code of Federal Regulations (2003) 73.682 (a) (20)"]
        case 5:  return ["Rec. ITU-R BT.470-6 System B, G (historical)", 
                    "Rec. ITU-R BT.601-7 625",
                    "Rec. ITU-R BT.1358-0 625 (historical)",
                    "Rec. ITU-R BT.1700-0 625 PAL and 625 SECAM"]
        case 6:  return ["Rec. ITU-R BT.601-7 525", 
                    "Rec. ITU-R BT.1358-1 525 or 625 (historical)",
                    "Rec. ITU-R BT.1700-0 NTSC",
                    "Society of Motion Picture and Television Engineers ST 170 (2004)"]
        case 7:  return ["Society of Motion Picture and Television Engineers ST 240 (1999)"]
        case 8:  return ["Generic film (colour filters using Illuminant C)"]
        case 9:  return ["Rec. ITU-R BT.2020-2",
                    "Rec. ITU-R BT.2100-2"] 
        case 10: return ["Society of Motion Picture and Television Engineers ST 428-1 (2019)", 
                    "(CIE 1931 XYZ as in ISO 11664 1)"]
        case 11: return ["Society of Motion Picture and Television Engineers RP 431-2 (2011)"]
        case 12: return ["Society of Motion Picture and Television  Engineers EG 432-1 (2010)"]
        case 22: return ["No corresponding industry specification identified"]
    }   
    return [warn("Reserved -- For future use by ITU-T | ISO/IEC")]
}


function ISOIEC23091_2_TransferCharacteristics(value) {
    if (value > 255)
        return [err('invalid value ('+value+')')]
    switch (value) {
        case  1: return ["Rec. ITU-R BT.709-6", 
                    "Rec. ITU-R BT.1361-0 conventional colour gamut system (historical)"]
        case  2: return [title("Unspecified"), 
                    "Image characteristics are unknown or are determined by the application."]
        case  4: return [title("Assumed display gamma 2.2"),
                    "Rec. ITU-R BT.470-6 System M (historical)",
                    "United States National Television System Committee 1953 Recommendation for transmission standards for colour television",
                    "United States Federal Communications Commission Title 47 Code of Federal Regulations (2003) 73.682 (a) (20)",
                    "Rec. ITU-R BT.1700-0 625 PAL and 625 SECAM"]
        case  5: return [title("Assumed display gamma 2.8"), 
                    "Rec. ITU-R BT.470-6 System B, G (historical)"]
        case  6: return ["Rec. ITU-R BT.601-7 525 or 625",
                    "Rec. ITU-R BT.1358-1 525 or 625 (historical)",
                    "Rec. ITU-R BT.1700-0 NTSC",
                    "Society of Motion Picture and Television Engineers ST 170 (2004)"]
        case  7: return ["Society of Motion Picture and Television Engineers ST 240 (1999) "]
        case  8: return ["Linear transfer characteristics"]
        case  9: return ["Logarithmic transfer characteristic (100:1 range)"]
        case 10: return ["Logarithmic transfer characteristic (100 * Sqrt( 10 ) : 1 range)"]
        case 11: return ["IEC 61966-2-4"]
        case 12: return ["Rec. ITU-R BT.1361-0 extended colour gamut system (historical)"]
        case 13: return ["IEC 61966-2-1 sRGB or(with MatrixCoefficients equal to 0)",
                    "IEC 61966-2-1 sYCC (with MatrixCoefficients equal to 5)"]
        case 14: return ["Rec. ITU-R BT.2020-2"]
        case 15: return ["Rec. ITU-R BT.2020-2"]
        case 16: return ["Society of Motion Picture and Television Engineers ST 2084 (2014) for 10, 12, 14, and 16-bit systems" ,
                    "Rec. ITU-R BT.2100-2 perceptual quantization (PQ) system"]
        case 17: return ["Society of Motion Picture and Television Engineers ST 428-1 (2019)"]
        case 18: return ["Association of Radio Industries and Businesses (ARIB) STD-B67 (2018)",
                    "Rec. ITU-R BT.2100-2 hybrid log-gamma (HLG) system"]
    }
    return [warn("Reserved -- For future use by ITU-T | ISO/IEC")]        
}


function ISOIEC23091_2_MatrixCoefficients(value) {
    if (value > 255)
        return [err('invalid value ('+value+')')]
    switch (value) {
        case  0: return [title("Identity"), "The identity matrix.", 
                    "Typically used for GBR (often referred to as RGB); however, may also be used for YZX (often referred to as XYZ);",
                    "IEC 61966-2-1 sRGB", "Society of Motion Picture and Television Engineers ST 428-1 (2019)"]
        case  1: return ["Rec. ITU-R BT.709-6", "Rec. ITU-R BT.1361-0 conventional colour gamut system and extended colour gamut system (historical)",
                    "IEC 61966-2-4 xvYCC<sub>709</sub>", "Society of Motion Picture and Television Engineers RP 177 (1993) Annex B"]
        case  2: return [title("Unspecified"), "Image characteristics are unknown or are determined by the application"]
        case  4: return ["United States Federal Communications Commission Title 47 Code of Federal Regulations (2003) 73.682 (a) (20)"]
        case  5: return ["Rec. ITU-R BT.470-6 System B, G (historical)", "Rec. ITU-R BT.601-7 625", "Rec. ITU-R BT.1358-0 625 (historical)",
                    "Rec. ITU-R BT.1700-0 625 PAL and 625 SECAM", "IEC 61966-2-1 sYCC", "IEC 61966-2-4 xvYCC<sub>601</sub>"]
        case  6: return ["Rec. ITU-R BT.601-7 525", "Rec. ITU-R BT.1358-1 525 or 625 (historical)",
                    "Rec. ITU-R BT.1700-0 NTSC", "Society of Motion Picture and Television Engineers ST 170 (2004)"]
        case  7: return ["Society of Motion Picture and Television Engineers ST 240 (1999)"]
        case  8: return [title("YCgCo")]
        case  9: return ["Rec. ITU-R BT.2020-2 (non-constant luminance)", "Rec. ITU-R BT.2100-2 Y′CbCr"]
        case 10: return ["Rec. ITU-R BT.2020-2 (constant luminance)"]
        case 11: return ["Society of Motion Picture and Television Engineers ST 2085 (2015)"]
        case 12: return ["Chromaticity-derived non-constant luminance system"]
        case 13: return ["Chromaticity-derived constant luminance system"]
        case 14: return ["Rec. ITU-R BT.2100-2 IC<sub>T</sub>C<sub>P</sub>"]
    }
    return [warn("Reserved -- For future use by ITU-T | ISO/IEC")]        
}

function ISOIEC23091_2_PackedContentInterpretationType(value) {
    if (value > 15)
        return [err('invalid value ('+value+')')]
    switch (value) {
        case  0: return ["Unspecified relationship between the frame packed constituent frames"]
        case  1: return ["Indicates that the two constituent frames form the left and right views of a stereo view scene, with frame 0 being associated with the left view and frame 1 being associated with the right view"]
        case  2: return ["Indicates that the two constituent frames form the right and left views of a stereo view scene, with frame 0 being associated with the right view and frame 1 being associated with the left view"]
    }
    return [warn("Reserved -- For future use by ITU-T | ISO/IEC")]        
}

function ISOIEC23091_2_SampleAspectRatio(value) {
    if (value > 255)
        return [err('invalid value ('+value+')')]
    switch (value) {
        case  0: return ["Unspecified"]
        case  1: return ["1:1"]
        case  2: return ["12:11"]
        case  3: return ["10:11"]
        case  4: return ["16:11"]
        case  5: return ["40:33"]
        case  6: return ["24:11"]
        case  7: return ["20:11"]
        case  8: return ["32:11"]
        case  9: return ["80:33"]
        case 10: return ["18:11"]
        case 11: return ["15:11"]
        case 12: return ["64:33"]
        case 13: return ["160:99"]
        case 14: return ["4:3"]
        case 15: return ["3:2"]
        case 16: return ["2:1"]
        case 255: return ["SarWidth : SarHeight"]
    }
    return [warn("Reserved -- For future use by ITU-T | ISO/IEC")]        
}


function ISOIEC23091_2_VideoFramePackingType(value) {
    switch (value) {
        case 0: return "Each component plane of the decoded frames contains a \"checkerboard\" based interleaving of corresponding planes of two constituent frames as illustrated in Figure 2"
        case 1: return "Each component plane of the decoded frames contains a column-based interleaving of corresponding planes of two constituent frames as illustrated in Figure 3"
        case 2: return "Each component plane of the decoded frames contains a row-based interleaving of corresponding planes of two constituent frames as illustrated in Figure 4"
        case 3: return "Each component plane of the decoded frames contains a side-by-side packing arrangement of corresponding planes of two constituent frames as illustrated in Figure 5 and Figure 7"
        case 4: return "Each component plane of the decoded frames contains top-bottom packing arrangement of corresponding planes of two constituent frames as illustrated in Figure 6"
        case 5: return "The component planes of the decoded frames in output order form a temporal interleaving of alternating first and second constituent frames as illustrated in Figure 8"
        case 6: return "The decoded frame constitutes a complete 2D frame without any frame packing (see NOTE 4).<BR>NOTE 4	VideoFramePackingType equal to 6 is used to signal the presence of 2D content (that is not frame packed) in 3D services that use a mix of 2D and 3D content."
    }
    return warn("Reserved -- For future use by ITU-T | ISO/IEC")   
}

function ISOIEC23091_2_QuincunxSamplingFlag(value) {

}

function decodeEVC(val) {

    function printBitDepth(args) {
        let luma=Math.floor(args.value/10), chroma=args.value%10
        return cell(args.value)+cell("luma="+(luma+8)+"bit, chroma="+(chroma+8)+"bit")
    }

    function printChroma(args) {
        let J=Math.floor(args.value/100), a=Math.floor((args.value-(J*100))/10), b=args.value%10
        return cell(args.value)+cell(J+":"+a+":"+b)
    }

    function describe(value, infoFunction) {
        let res=""
        let descriptions=infoFunction(value)
        descriptions.forEach(desc=>{
            res+=desc+BREAK
        })
        return cell(value)+cell(res)
    }

    function printProfile(args) {
        // accprding to Annex A.3 of ISO/IEC 23094-1 (FDIS is w19229)
        let res=""
        switch (args.value) {
            case 0: res="Baseline profile"; break
            case 1: res="Main profile"; break
            case 2: res="Baseline Still Picture profile"; break
            case 3: res="Main Still Picture profile"; break
            default: res=err('invalid'); break
        }
        return cell(args.value)+cell(res)
    }
    function printLevel(args) {
        // accprding to Annex A.4 of ISO/IEC 23094-1 (FDIS is w19229)
        let res=""
        switch (args.value) {
            case 10: res="Level 1"; break
            case 20: res="Level 2"; break
            case 21: res="Level 2.1"; break
            case 30: res="Level 3"; break
            case 31: res="Level 3.1"; break
            case 40: res="Level 4"; break
            case 41: res="Level 4.1"; break
            case 50: res="Level 5"; break
            case 51: res="Level 5.1"; break
            case 52: res="Level 5.1"; break
            case 60: res="Level 6"; break
            case 61: res="Level 6.1"; break
            case 62: res="Level 6.1"; break
            default: res=err('invalid'); break
        }
        return cell(args.value)+cell(res)
    }
    function printColourPrimaries(args) {
        return describe(args.value, ISOIEC23091_2_ColourPrimaries)
    }
    function printTransferCharacteristics(args) {
        return describe(args.value, ISOIEC23091_2_TransferCharacteristics)
    }
    function printMatrixCoefficients(args) {
        return describe(args.value, ISOIEC23091_2_MatrixCoefficients)
    }
    function printFramePackingType(args) {
        if (!args.value)
            return cell("no frame packing is used",2)
        let qsf=Math.floor(args.value/10), vfpt=args.value%10
        return cell(args.value)+cell("QuincunxSamplingFlag="+ISOIEC23091_2_QuincunxSamplingFlag(qsf)
                    +", VideoFramePackingType="+ISOIEC23091_2_VideoFramePackingType(vfpt))    
    }
    function printPackedContentInterpretationType(args) {
        if (!args.value)
            return cell("packed content is not used", 2)
        return describe(args.value, ISOIEC23091_2_PackedContentInterpretationType)
    }
    function printSampleAspectRatio(args) {
        return describe(args.value, ISOIEC23091_2_SampleAspectRatio)
    }


    function printHex3(args) {
        let enc=args.value.toString(16)
        while (enc.length<6) enc="0"+enc
        return cell("0x"+enc)+cell("")
    }
    
    function SetKeyValue(values, key, value, expression) {
        if (!expression.test(value)) 
            return err('invalid value for key='+key)+BREAK

        let t=values.find(elem=>elem.key==key)
        if (t) {
            t.value=sscanf(value, "%d")[0]
            t.default=false
        }
        return ""
    }

    var parts=val.split(".")

    const KEY_PROFILE='vprf', KEY_LEVEL='vlev', KEY_TOOLSET_HIGH='vtoh', KEY_TOOLSET_LOW='vtol'
    const KEY_BIT_DEPTH='vbit', KEY_CHROMA='vcss', KEY_PRIMARIES='vcpr'
    const KEY_XFER_CHAR='vtrc', KEY_MATRIX_COEFF='vmac', KEY_FULL_RANGE='vfrf'
    const KEY_FRAME_PACK='vfpq', KEY_INTERPRETATION='vpci', KEY_SAR='vsar'

    let values=[
        {key:KEY_PROFILE, label: 'Profile', value:1, default:true, printFn:printProfile},
        {key:KEY_LEVEL, label: 'Level', value:51, default:true, printFn:printLevel},
        {key:KEY_TOOLSET_HIGH, label: 'Toolset High', value:0x1ffff, default:true, printFn:printHex3},
        {key:KEY_TOOLSET_LOW, label: 'Toolset Low', value:0x000000, default:true, printFn:printHex3},
        {key:KEY_BIT_DEPTH, label: 'Bit Depth', value:0, default:true, printFn:printBitDepth},
        {key:KEY_CHROMA, label: 'Chroma Subsampling', value:420, default:true, printFn:printChroma},
        {key:KEY_PRIMARIES, label: 'Colour Primaries', value:1, default:true, printFn:printColourPrimaries},
        {key:KEY_XFER_CHAR, label: 'Transfer Characteristics', value:1, default:true,printFn:printTransferCharacteristics},        
        {key:KEY_MATRIX_COEFF, label: 'Matrix Coefficients', value:1, default:true, printFn:printMatrixCoefficients},
        {key:KEY_FULL_RANGE, label: 'Full Range Flag', value:1, default:true},
        {key:KEY_FRAME_PACK, label: 'Frame Packing Type', value:null, default:true, printFn:printFramePackingType},
        {key:KEY_INTERPRETATION, label: 'Packed Content Interpretation', value:null, default:true, printFn:printPackedContentInterpretationType},
        {key:KEY_SAR, label: 'Sample Aspect Ratio', value:1, default:true, printFn:printSampleAspectRatio}
        ]

    let res=""
    
    for (let i=1; i<parts.length; i++) {
        let key=parts[i].substring(0,4)
        let value=parts[i].substring(4)
        switch (key.toLowerCase()) {
            case KEY_PROFILE:
                const ProfileRegex=/^\d+$/
                res+=SetKeyValue(values, key, value, ProfileRegex)
                break
            case KEY_LEVEL:
                const LevelRegex=/^\d+$/
                res+=SetKeyValue(values, key, value, LevelRegex)
                break
            case KEY_TOOLSET_HIGH:
                break
            case KEY_TOOLSET_LOW:
                break
            case KEY_BIT_DEPTH:
                const BitDepthRegex=/^\d\d$/i
                res+=SetKeyValue(values, key, value, BitDepthRegex)
                break
            case KEY_CHROMA:
                const ChromaRegex=/^\d{3}$/
                res+=SetKeyValue(values, key, value, ChromaRegex)
                break
            case KEY_PRIMARIES:
                const ColourPrimariesRegex=/^\d{2}$/
                res+=SetKeyValue(values, key, value, ColourPrimariesRegex)
                break
            case KEY_XFER_CHAR:
                const TransferCharacteristicsRegex=/^\d{2}$/
                res+=SetKeyValue(values, key, value, TransferCharacteristicsRegex)
                break
            case KEY_MATRIX_COEFF:
                const MatrixCoefficientsRegex=/^\d{2}$/
                res+=SetKeyValue(values, key, value, MatrixCoefficientsRegex)
                break
            case KEY_FULL_RANGE:
                const FullRangeFlagRegex=/^[01]$/
                res+=SetKeyValue(values, key, value, FullRangeFlagRegex)
                break
            case KEY_FRAME_PACK:
                const FramePackingRegex=/^[01]\d$/
                res+=SetKeyValue(values, key, value, FramePackingRegex)
                break
            case KEY_INTERPRETATION:
                const PackedContentInterpretationTypeRegex=/^\d$/
                res+=SetKeyValue(values, key, value, PackedContentInterpretationTypeRegex)
                break
            case KEY_SAR:
                const SampleAspectRatioRegex=/^\d{2}$/
                res+=SetKeyValue(values, key, value, SampleAspectRatioRegex)
                break
            default:
                res+=err('invalid key specified ('+key+')')+BREAK
                break
        } 
    }

    res+="<table>"
    values.forEach(k=>{

        res+=cell(k.key)+cell(k.label)
        if (k.printFn) {res+=k.printFn(k) }
        else {res+=cell(k.value, 2)}   
        res+=cell(k.default?"(default)":"")
        res+="</tr>" 

    })
    res+="</table>"
    return res+BREAK
}

addHandler("evc1", "MPEG Essential Video Coding", decodeEVC)
