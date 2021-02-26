
// see annex E.9 of  ISO/IEC 14496-15:2019 Amd.2 "Carriage of VVC and EVC in ISOBMFF"
// w19454

function decodeEVC(val) {


    function printBitDepth(args) {
        let luma=Math.floor(args.value/10), chroma=args.value%10
        return args.label+": luma="+(luma+8)+"bit, chroma="+(chroma+8)+"bit"
    }


    var parts=val.split(".")

    const KEY_PROFILE='vprf', KEY_LEVEL='vlev', KEY_TOOLSET_HIGH='vtoh', KEY_TOOLSET_LOW='vtol'
    const KEY_BIT_DEPTH='vbit', KEY_CHROMA='vcss', KEY_PRIMARIES='vcpr'
    const KEY_XFER_CHAR='vtrc', KEY_MATRIX_COEFF='vmac'
    const KEY_FULL_RANGE='vfrf', KEY_FRAME_PACK='vfpq', KEY_INTERPRETATION='vpci'
    const KEY_SAR='vsar'
    let values=[
        {key:KEY_PROFILE, label: 'Profile', value:1, default:true},
        {key:KEY_LEVEL, label: 'Level', value:1, default:true},
        {key:KEY_TOOLSET_HIGH, label: 'Toolset High', value:0x1ffff, default:true},
        {key:KEY_TOOLSET_LOW, label: 'Toolset Low', value:0x000000, default:true},
        {key:KEY_BIT_DEPTH, label: 'Bit Depth', value:0, default:true, printFn: printBitDepth},
        {key:KEY_CHROMA, label: 'Chroma Subsampling', value:420, default:true},
        {key:KEY_PRIMARIES, label: 'Colour Primries', value:1, default:true},
        {key:KEY_XFER_CHAR, label: 'Transfer Characteristics', value:1, default:true},        
        {key:KEY_MATRIX_COEFF, label: 'Matrix Coefficients', value:1, default:true},
        {key:KEY_FULL_RANGE, label: 'Full Range Flag', value:1, default:true},
        {key:KEY_FRAME_PACK, label: 'Frame Packing Type', value:null, default:true},
        {key:KEY_INTERPRETATION, label: 'Packed Content Interpretation', value:null, default:true},
        {key:KEY_SAR, label: 'Sample Aspect Ratio', value:1, default:true}
        ]

    let res=""
    
    for (let i=1; i<parts.length; i++) {
        let key=parts[i].substring(0,4)
        let value=parts[i].substring(4)
        switch (key.toLowerCase()) {
            case KEY_PROFILE:
                break
            case KEY_LEVEL:
                break
            case KEY_TOOLSET_HIGH:
                break
            case KEY_TOOLSET_LOW:
                break
            case KEY_BIT_DEPTH:
                const BitDepthRegex=/^\d\d$/i
                if (BitDepthRegex.test(value)) {
                    let t=values.find(elem=>elem.key==key)
                    if (t) {
                        t.value=sscanf(value, "%d")[0]
                        t.default=false
                    }
                }
                else res+=err('invalid value for key='+key)+BREAK
                break
            case KEY_CHROMA:
                break
            case KEY_PRIMARIES:
                break
            case KEY_XFER_CHAR:
                break
            case KEY_MATRIX_COEFF:
                break
            case KEY_FULL_RANGE:
                break
            case KEY_FRAME_PACK:
                break
            case KEY_INTERPRETATION:
                break
            case KEY_SAR:
                break
            default:
                res+=err('invalid key specified ('+key+')')+BREAK
                break
        } 
    }

    values.forEach(k=>{if (k.printFn) {res+=k.printFn(k)+BREAK} else {res+=k.label+"="+k.value+(k.default?" (default)":"")+BREAK}})
    return res+BREAK
}

addHandler("evc1", "MPEG Essential Video Coding", decodeEVC)
