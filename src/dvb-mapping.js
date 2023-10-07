/**
 * @copyright: Copyright (c) 2023
 * @author: Paul Higgs
 * @file: dvb-mapping.js
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *	this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *	notice, this list of conditions and the following disclaimer in the
 *	documentation and/or other materials provided with the distribution.
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

let VideoCodecCS = "urn:dvb:metadata:cs:VideoCodecCS:2022";
let VideoTerms = [
	{ term: "1", codec: "avc1" },

	{ term: "1.1", codec: "avc1", profile: "Baseline" },
	{ term: "1.1.1", codec: "avc1", profile: "Baseline", level: "1" },
	{ term: "1.1.2", codec: "avc1", profile: "Baseline", level: "1b" },
	{ term: "1.1.3", codec: "avc1", profile: "Baseline", level: "1.1" },
	{ term: "1.1.4", codec: "avc1", profile: "Baseline", level: "1.2" },
	{ term: "1.1.5", codec: "avc1", profile: "Baseline", level: "1.3" },
	{ term: "1.1.6", codec: "avc1", profile: "Baseline", level: "2" },
	{ term: "1.1.7", codec: "avc1", profile: "Baseline", level: "2.1" },
	{ term: "1.1.8", codec: "avc1", profile: "Baseline", level: "2.2" },
	{ term: "1.1.9", codec: "avc1", profile: "Baseline", level: "3" },
	{ term: "1.1.10", codec: "avc1", profile: "Baseline", level: "3.1" },
	{ term: "1.1.11", codec: "avc1", profile: "Baseline", level: "3.2" },
	{ term: "1.1.12", codec: "avc1", profile: "Baseline", level: "4" },
	{ term: "1.1.13", codec: "avc1", profile: "Baseline", level: "4.1" },
	{ term: "1.1.14", codec: "avc1", profile: "Baseline", level: "4.2" },
	{ term: "1.1.15", codec: "avc1", profile: "Baseline", level: "5" },
	{ term: "1.1.16", codec: "avc1", profile: "Baseline", level: "5.1" },

	{ term: "1.2", codec: "avc1", profile: "Main" },
	{ term: "1.2.1", codec: "avc1", profile: "Main", level: "1" },
	{ term: "1.2.2", codec: "avc1", profile: "Main", level: "1b" },
	{ term: "1.2.3", codec: "avc1", profile: "Main", level: "1.1" },
	{ term: "1.2.4", codec: "avc1", profile: "Main", level: "1.2" },
	{ term: "1.2.5", codec: "avc1", profile: "Main", level: "1.3" },
	{ term: "1.2.6", codec: "avc1", profile: "Main", level: "2" },
	{ term: "1.2.7", codec: "avc1", profile: "Main", level: "2.1" },
	{ term: "1.2.8", codec: "avc1", profile: "Main", level: "2.2" },
	{ term: "1.2.9", codec: "avc1", profile: "Main", level: "3" },
	{ term: "1.2.10", codec: "avc1", profile: "Main", level: "3.1" },
	{ term: "1.2.11", codec: "avc1", profile: "Main", level: "3.2" },
	{ term: "1.2.12", codec: "avc1", profile: "Main", level: "4" },
	{ term: "1.2.13", codec: "avc1", profile: "Main", level: "4.1" },
	{ term: "1.2.14", codec: "avc1", profile: "Main", level: "4.2" },
	{ term: "1.2.15", codec: "avc1", profile: "Main", level: "5" },
	{ term: "1.2.16", codec: "avc1", profile: "Main", level: "5.1" },

	{ term: "1.3", codec: "avc1", profile: "Extended" },
	{ term: "1.3.1", codec: "avc1", profile: "Extended", level: "1" },
	{ term: "1.3.2", codec: "avc1", profile: "Extended", level: "1b" },
	{ term: "1.3.3", codec: "avc1", profile: "Extended", level: "1.1" },
	{ term: "1.3.4", codec: "avc1", profile: "Extended", level: "1.2" },
	{ term: "1.3.5", codec: "avc1", profile: "Extended", level: "1.3" },
	{ term: "1.3.6", codec: "avc1", profile: "Extended", level: "2" },
	{ term: "1.3.7", codec: "avc1", profile: "Extended", level: "2.1" },
	{ term: "1.3.8", codec: "avc1", profile: "Extended", level: "2.2" },
	{ term: "1.3.9", codec: "avc1", profile: "Extended", level: "3" },
	{ term: "1.3.10", codec: "avc1", profile: "Extended", level: "3.1" },
	{ term: "1.3.11", codec: "avc1", profile: "Extended", level: "3.2" },
	{ term: "1.3.12", codec: "avc1", profile: "Extended", level: "4" },
	{ term: "1.3.13", codec: "avc1", profile: "Extended", level: "4.1" },
	{ term: "1.3.14", codec: "avc1", profile: "Extended", level: "4.2" },
	{ term: "1.3.15", codec: "avc1", profile: "Extended", level: "5" },
	{ term: "1.3.16", codec: "avc1", profile: "Extended", level: "5.1" },

	{ term: "1.4", codec: "avc1", profile: "High" },
	{ term: "1.4.1", codec: "avc1", profile: "High", level: "1" },
	{ term: "1.4.2", codec: "avc1", profile: "High", level: "1b" },
	{ term: "1.4.3", codec: "avc1", profile: "High", level: "1.1" },
	{ term: "1.4.4", codec: "avc1", profile: "High", level: "1.2" },
	{ term: "1.4.5", codec: "avc1", profile: "High", level: "1.3" },
	{ term: "1.4.6", codec: "avc1", profile: "High", level: "2" },
	{ term: "1.4.7", codec: "avc1", profile: "High", level: "2.1" },
	{ term: "1.4.8", codec: "avc1", profile: "High", level: "2.2" },
	{ term: "1.4.9", codec: "avc1", profile: "High", level: "3" },
	{ term: "1.4.10", codec: "avc1", profile: "High", level: "3.1" },
	{ term: "1.4.11", codec: "avc1", profile: "High", level: "3.2" },
	{ term: "1.4.12", codec: "avc1", profile: "High", level: "4" },
	{ term: "1.4.13", codec: "avc1", profile: "High", level: "4.1" },
	{ term: "1.4.14", codec: "avc1", profile: "High", level: "4.2" },
	{ term: "1.4.15", codec: "avc1", profile: "High", level: "5" },
	{ term: "1.4.16", codec: "avc1", profile: "High", level: "5.1" },

	{ term: "1.5", codec: "avc1", profile: "High 10" },
	{ term: "1.5.1", codec: "avc1", profile: "High 10", level: "1" },
	{ term: "1.5.2", codec: "avc1", profile: "High 10", level: "1b" },
	{ term: "1.5.3", codec: "avc1", profile: "High 10", level: "1.1" },
	{ term: "1.5.4", codec: "avc1", profile: "High 10", level: "1.2" },
	{ term: "1.5.5", codec: "avc1", profile: "High 10", level: "1.3" },
	{ term: "1.5.6", codec: "avc1", profile: "High 10", level: "2" },
	{ term: "1.5.7", codec: "avc1", profile: "High 10", level: "2.1" },
	{ term: "1.5.8", codec: "avc1", profile: "High 10", level: "2.2" },
	{ term: "1.5.9", codec: "avc1", profile: "High 10", level: "3" },
	{ term: "1.5.10", codec: "avc1", profile: "High 10", level: "3.1" },
	{ term: "1.5.11", codec: "avc1", profile: "High 10", level: "3.2" },
	{ term: "1.5.12", codec: "avc1", profile: "High 10", level: "4" },
	{ term: "1.5.13", codec: "avc1", profile: "High 10", level: "4.1" },
	{ term: "1.5.14", codec: "avc1", profile: "High 10", level: "4.2" },
	{ term: "1.5.15", codec: "avc1", profile: "High 10", level: "5" },
	{ term: "1.5.16", codec: "avc1", profile: "High 10", level: "5.1" },

	{ term: "1.6", codec: "avc1", profile: "High 4:2:2" },
	{ term: "1.6.1", codec: "avc1", profile: "High 4:2:2", level: "1" },
	{ term: "1.6.2", codec: "avc1", profile: "High 4:2:2", level: "1b" },
	{ term: "1.6.3", codec: "avc1", profile: "High 4:2:2", level: "1.1" },
	{ term: "1.6.4", codec: "avc1", profile: "High 4:2:2", level: "1.2" },
	{ term: "1.6.5", codec: "avc1", profile: "High 4:2:2", level: "1.3" },
	{ term: "1.6.6", codec: "avc1", profile: "High 4:2:2", level: "2" },
	{ term: "1.6.7", codec: "avc1", profile: "High 4:2:2", level: "2.1" },
	{ term: "1.6.8", codec: "avc1", profile: "High 4:2:2", level: "2.2" },
	{ term: "1.6.9", codec: "avc1", profile: "High 4:2:2", level: "3" },
	{ term: "1.6.10", codec: "avc1", profile: "High 4:2:2", level: "3.1" },
	{ term: "1.6.11", codec: "avc1", profile: "High 4:2:2", level: "3.2" },
	{ term: "1.6.12", codec: "avc1", profile: "High 4:2:2", level: "4" },
	{ term: "1.6.13", codec: "avc1", profile: "High 4:2:2", level: "4.1" },
	{ term: "1.6.14", codec: "avc1", profile: "High 4:2:2", level: "4.2" },
	{ term: "1.6.15", codec: "avc1", profile: "High 4:2:2", level: "5" },
	{ term: "1.6.16", codec: "avc1", profile: "High 4:2:2", level: "5.1" },

	{ term: "1.7", codec: "avc1", profile: "High 4:4:4 Predictive" },
	{ term: "1.7.1", codec: "avc1", profile: "High 4:4:4 Predictive", level: "1" },
	{ term: "1.7.2", codec: "avc1", profile: "High 4:4:4 Predictive", level: "1b" },
	{ term: "1.7.3", codec: "avc1", profile: "High 4:4:4 Predictive", level: "1.1" },
	{ term: "1.7.4", codec: "avc1", profile: "High 4:4:4 Predictive", level: "1.2" },
	{ term: "1.7.5", codec: "avc1", profile: "High 4:4:4 Predictive", level: "1.3" },
	{ term: "1.7.6", codec: "avc1", profile: "High 4:4:4 Predictive", level: "2" },
	{ term: "1.7.7", codec: "avc1", profile: "High 4:4:4 Predictive", level: "2.1" },
	{ term: "1.7.8", codec: "avc1", profile: "High 4:4:4 Predictive", level: "2.2" },
	{ term: "1.7.9", codec: "avc1", profile: "High 4:4:4 Predictive", level: "3" },
	{ term: "1.7.10", codec: "avc1", profile: "High 4:4:4 Predictive", level: "3.1" },
	{ term: "1.7.11", codec: "avc1", profile: "High 4:4:4 Predictive", level: "3.2" },
	{ term: "1.7.12", codec: "avc1", profile: "High 4:4:4 Predictive", level: "4" },
	{ term: "1.7.13", codec: "avc1", profile: "High 4:4:4 Predictive", level: "4.1" },
	{ term: "1.7.14", codec: "avc1", profile: "High 4:4:4 Predictive", level: "4.2" },
	{ term: "1.7.15", codec: "avc1", profile: "High 4:4:4 Predictive", level: "5" },
	{ term: "1.7.16", codec: "avc1", profile: "High 4:4:4 Predictive", level: "5.1" },

	{ term: "1.8", codec: "avc1", profile: "Scalable*" },
	{ term: "1.8.9", codec: "avc1", profile: "Scalable*", level: "3" },
	{ term: "1.8.10", codec: "avc1", profile: "Scalable*", level: "3.1" },
	{ term: "1.8.11", codec: "avc1", profile: "Scalable*", level: "3.2" },
	{ term: "1.8.12", codec: "avc1", profile: "Scalable*", level: "4" },
	{ term: "1.8.13", codec: "avc1", profile: "Scalable*", level: "4.1" },
	{ term: "1.8.14", codec: "avc1", profile: "Scalable*", level: "4.2" },

	{ term: "1.9", codec: "avc1", profile: "Stereo*" },
	{ term: "1.9.9", codec: "avc1", profile: "Stereo*", level: "3" },
	{ term: "1.9.10", codec: "avc1", profile: "Stereo*", level: "3.1" },
	{ term: "1.9.11", codec: "avc1", profile: "Stereo*", level: "3.2" },
	{ term: "1.9.12", codec: "avc1", profile: "Stereo*", level: "4" },
	{ term: "1.9.13", codec: "avc1", profile: "Stereo*", level: "4.1" },
	{ term: "1.9.14", codec: "avc1", profile: "Stereo*", level: "4.2" },

	{ term: "2", codec: "" },
];

function tableLookup(entry) {
	let res = true;
	let ek = Object.keys(entry),
		tk = Object.keys(this);
	let match_count = (keys_count = 0);

	//dbg console.log(`ek["profile"]==${ek["profile"]}`);
	//dbg console.dir(ek);
	//dbg console.dir(tk);
	if (ek.length != tk.length) return false;
	ek.forEach((key, index) => {
		if (key != "term") {
			keys_count++;

			if (entry[key] && this[key]) {
				let wc = entry[key].indexOf("*");
				let ek2 = wc == -1 ? entry[key] : entry[key].substring(0, wc);
				let tk2 = wc == -1 ? this[key] : this[key].substring(0, wc);
				//dbg console.log(`${key}: ${ek2} == ${tk2} => ${ek2 == tk2}`);
				if (ek2 === tk2) match_count++;
			}
		}
	});

	let rc = keys_count != 0 && match_count == keys_count;
	//dbg console.log(`keys_count=${keys_count} match_count=${match_count} ==> rc=${rc}`);
	return rc;
}

function match(cs, terms, params) {
	let found = terms.find(tableLookup, params);
	// console.dir(found);
	return found ? `${cs}:${found.term}` : "";
}

function DVBclassification(params) {
	if (!params?.type) return "";

	let res = "";
	switch (params.type) {
		case "video":
			res = match(VideoCodecCS, VideoTerms, params);
			break;
	}
	return res;
}

//dbg console.log(`1: ${DVBclassification({ type: "video", codec: "avc1", profile: "High", level: "3.2" })}`);
//dbg console.log(`2: ${DVBclassification({ type: "video", codec: "avc1", profile: "High" })}`);
//dbg console.log(`3: ${DVBclassification({ type: "video", codec: "avc1", profile: "Scalable Exh", level: "4.1" })}`);
