
const BREAK="<br>"
function err(str) { return "<span style=\"color:red\">"+str+"</span>" }
function bold(str) { return "<span style=\"font-weight;bold\">"+str+"</span>" }

class BitList {
	bytes=[]
	
	push(b) {this.bytes.push(b & 0xFF)}
	
	bitset(bitNo) {
		if (bitNo<=0 || bitNo>(this.bytes.length*8))
			return false;
		let idx=this.bytes.length-Math.floor((bitNo-1)/8)-1
		let bit=bitNo%8
		if (bit==0) bit=8
			
		return (this.bytes[idx] & 1<<(bit-1))?true:false
	}
	
	pointers(bitNo) {
		let idx=this.bytes.length-Math.floor((bitNo-1)/8)-1
		let bit=bitNo%8
		if (bit==0) bit=8
		return "<i>"+bitNo+"="+idx+":"+bit+"</i>"+BREAK
	}
	toString() {
		let i=0, res=""
		while (i<this.bytes.length) {
			let comp=this.bytes[i++].toString(16)
			res+=((comp.length==1)?"0":"")+comp
		}
		return res
	}
}


function bitSet32(val, bit) {
    // bit  3          2         1
	//      10987654321098765432109876543210	
	if (bit <0 || bit >31) return false
	return (val & Math.pow(2, bit))
}


function hexDigits(str) {
	var i,rc=true;
	res=str.match(/[\da-fA-F]+/)
	return res?res==str:false;
}

var handlers=[]
function addHandler(FourCC, Label, Handler) {
	if (!Handler) return
	
	if (typeof(FourCC) == "string") 
		if (!handlers.find(handler => handler.cccc == FourCC.toLowerCase()))
			handlers.push({cccc: FourCC.toLowerCase(), label: Label, func: Handler})
		
	if (typeof(FourCC) == "object")
		FourCC.forEach(cc =>{
			if (!handlers.find(handler => handler.cccc == cc.toLowerCase()))
				handlers.push({cccc: cc.toLowerCase(), label: Label, func: Handler})
		})
}


function noHandler(v) {return ""}
addHandler("ec-3", "Enhanced AC-3", noHandler)


function decode(val) {
	
	var res=""
	
	var codecs=val.split(",")
	
	codecs.forEach(component => {
		component=component.replace(/\s/gm,'')
		console.log(component)
		var codec=(component.indexOf(".") == -1)?component:component.substr(0, component.indexOf("."))
		let handler=handlers.find(h => h.cccc == codec.toLowerCase())
		if (handler)
			res+=bold(handler.label)+BREAK+handler.func(component)
		else
			res+=err("unsupported codec="+codec)
		res+=BREAK+BREAK
	})
	return res;
}
