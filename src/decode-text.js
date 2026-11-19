/**
 * @copyright: Copyright (c) 2021-2026
 * @author: Paul Higgs
 * @file: decode-text.js
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
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
const DEBUGGING = false;

import { normal, error, warning } from './decode.js';
import { simpleHTML } from './formatters.js';
import { expressions } from './regular_expressions.js';

// The profile codes after "stpp.ttml." are registered in:
//   TTML Media Type Definition and Profile Registry, W3C Group Note, 2 July 2026
//   latest version: https://www.w3.org/TR/ttml-profile-registry/
//   this version:   https://www.w3.org/TR/2026/NOTE-ttml-profile-registry-20260702/
// Section 4.1 lists the registered 4-character profile identifiers. Section 2 defines how they are combined:
//   codecs-parameter-value = and-group *( "|" and-group ),  and-group = identifier *( "+" identifier )
//   where "+" means AND, "|" means OR, and "+" has precedence, e.g. "im1t|etd1" or "im1t+etd1"
// Check the registry for new identifiers when updating this decoder.

// registered TTML profile identifiers, from section 4.1 of the TTML profile registry
//   name:       shown in the decoded output
//   designator: the profile designator listed in the registry
//   reference:  the specification that defines the profile, with a URL where one is known
const TTML_PROFILES = {
	cfi1: {
		name: 'DECE Image Subtitle Profile',
		designator: 'http://www.decellc.org/profile/cff-tt-image-1.1',
		// the registry cites UV-DMedia, the later name of the DECE Common File Format specification
		reference: 'Common File Format & Media Formats Specification version 2.2, clause 6.4.3.5. DECE. 31 July 2015',
		url: 'https://www.uvcentral.com/files/CFFMediaFormat-2_2.pdf',
	},
	cft1: {
		name: 'DECE Text Subtitle Profile',
		designator: 'http://www.decellc.org/profile/cff-tt-text-1.1',
		// the registry cites UV-DMedia, the later name of the DECE Common File Format specification
		reference: 'Common File Format & Media Formats Specification version 2.2, clause 6.4.3.4. DECE. 31 July 2015',
		url: 'https://www.uvcentral.com/files/CFFMediaFormat-2_2.pdf',
	},
	da1p: {
		name: 'DAPT 1.0 processor',
		designator: 'http://www.w3.org/ns/ttml/profile/dapt1.0/processor',
		reference: 'Dubbing and Audio description Profiles of TTML2 (DAPT). W3C',
		url: 'https://www.w3.org/TR/dapt/',
	},
	ede1: {
		name: 'EBU-TT-D-Basic-DE (IRT)',
		designator: 'urn:IRT:ebu-tt-basic-de:2013-07',
		reference: 'IRT Technical Guidelines: EBU-TT-D-Basic-DE',
	},
	etd1: {
		name: 'EBU-TT-D 1.0',
		designator: 'urn:ebu:tt:distribution:2014-01',
		reference: 'EBU TECH 3380: "EBU-TT-D Subtitling Distribution Format", Version 1.0. European Broadcasting Union. March 2015',
		url: 'https://tech.ebu.ch/docs/tech/tech3380v1_0.pdf',
	},
	etd2: {
		name: 'EBU-TT-D 1.0.1',
		designator: 'urn:ebu:tt:distribution:2018-04',
		reference: 'EBU TECH 3380: "EBU-TT-D Subtitling Distribution Format", Version 1.0.1. European Broadcasting Union. May 2018',
		url: 'https://tech.ebu.ch/docs/tech/tech3380v1_0_1.pdf',
	},
	etl1: {
		name: 'EBU-TT Live 1.0',
		designator: 'urn:ebu:tt:live:2017-05',
		reference: 'EBU TECH 3370: "EBU-TT, Part 3 Live Subtitling Applications", Version 1.0. European Broadcasting Union. May 2017',
		url: 'https://tech.ebu.ch/docs/tech/tech3370v1_0.pdf',
	},
	etx1: {
		name: 'EBU-TT 1.0',
		designator: 'urn:ebu:tt:exchange:2012-07',
		reference: 'EBU TECH 3350: "EBU-TT Subtitling format definition", Version 1.0. European Broadcasting Union. July 2012',
		url: 'https://tech.ebu.ch/docs/tech/tech3350v1-0.pdf',
	},
	etx2: {
		name: 'EBU-TT 1.1',
		designator: 'urn:ebu:tt:exchange:2015-09',
		reference: 'EBU TECH 3350: "EBU-TT Subtitling format definition", Version 1.1. European Broadcasting Union. September 2015',
		url: 'https://tech.ebu.ch/docs/tech/tech3350v1_1.pdf',
	},
	etx3: {
		name: 'EBU-TT 1.2',
		designator: 'urn:ebu:tt:exchange:2017-05',
		reference: 'EBU TECH 3350: "EBU-TT Subtitling format definition", Version 1.2. European Broadcasting Union. May 2017',
		url: 'https://tech.ebu.ch/docs/tech/tech3350v1_2.pdf',
	},
	im1i: {
		name: 'IMSC1 image',
		designator: 'http://www.w3.org/ns/ttml/profile/imsc1/image',
		reference: 'TTML Profiles for Internet Media Subtitles and Captions 1.0.1 (IMSC1). W3C Recommendation. 24 April 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml-imsc1.0.1-20180424/',
	},
	im1t: {
		name: 'IMSC1 text',
		designator: 'http://www.w3.org/ns/ttml/profile/imsc1/text',
		reference: 'TTML Profiles for Internet Media Subtitles and Captions 1.0.1 (IMSC1). W3C Recommendation. 24 April 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml-imsc1.0.1-20180424/',
	},
	im2i: {
		name: 'IMSC1.1 image (also IMSC1.2)',
		designator: 'http://www.w3.org/ns/ttml/profile/imsc1.1/image',
		// also used by IMSC 1.2: https://www.w3.org/TR/2020/REC-ttml-imsc1.2-20200804/
		reference: 'TTML Profiles for Internet Media Subtitles and Captions 1.1. W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml-imsc1.1-20181108/',
	},
	im2t: {
		name: 'IMSC1.1 text',
		designator: 'http://www.w3.org/ns/ttml/profile/imsc1.1/text',
		reference: 'TTML Profiles for Internet Media Subtitles and Captions 1.1. W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml-imsc1.1-20181108/',
	},
	im3t: {
		name: 'IMSC1.2 text',
		designator: 'http://www.w3.org/ns/ttml/profile/imsc1.2/text',
		reference: 'TTML Profiles for Internet Media Subtitles and Captions 1.2. W3C Recommendation. 4 August 2020',
		url: 'https://www.w3.org/TR/2020/REC-ttml-imsc1.2-20200804/',
	},
	im4t: {
		name: 'IMSC1.3 text',
		designator: 'http://www.w3.org/ns/ttml/profile/imsc1.3/text',
		reference: 'TTML Profiles for Internet Media Subtitles and Captions 1.3. W3C',
		url: 'https://www.w3.org/TR/ttml-imsc1.3/',
	},
	nst1: {
		name: 'Netflix IMSC 1.1 Text Profile',
		designator: 'https://www.netflix.com/ns/imsc1.1/text/1',
		reference: 'Netflix IMSC 1.1 Text Profile',
	},
	rtp1: {
		name: 'TTML RTP payload processor (RFC 8759)',
		designator: 'urn:ietf:rfc:8759#processor',
		reference: 'RFC 8759: RTP Payload for Timed Text Markup Language (TTML). IETF. March 2020. Proposed Standard',
		url: 'https://www.rfc-editor.org/rfc/rfc8759',
	},
	tt1f: {
		name: 'TTML1 full',
		designator: 'http://www.w3.org/ns/ttml/profile/dfxp-full',
		reference: 'Timed Text Markup Language 1 (TTML1) (Third Edition). W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml1-20181108/',
	},
	tt1p: {
		name: 'TTML1 presentation',
		designator: 'http://www.w3.org/ns/ttml/profile/dfxp-presentation',
		reference: 'Timed Text Markup Language 1 (TTML1) (Third Edition). W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml1-20181108/',
	},
	tt1s: {
		name: 'TTML1 simple delivery for closed captions (US)',
		designator: 'http://www.w3.org/ns/ttml/profile/sdp-us',
		reference: 'TTML Simple Delivery Profile for Closed Captions (US). W3C Note. 5 February 2013',
		url: 'https://www.w3.org/TR/2013/NOTE-ttml10-sdp-us-20130205/',
	},
	tt1t: {
		name: 'TTML1 transformation',
		designator: 'http://www.w3.org/ns/ttml/profile/dfxp-transformation',
		reference: 'Timed Text Markup Language 1 (TTML1) (Third Edition). W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml1-20181108/',
	},
	tt2f: {
		name: 'TTML2 full',
		designator: 'http://www.w3.org/ns/ttml/profile/ttml2-full',
		reference: 'Timed Text Markup Language 2 (TTML2). W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml2-20181108/',
	},
	tt2p: {
		name: 'TTML2 presentation',
		designator: 'http://www.w3.org/ns/ttml/profile/ttml2-presentation',
		reference: 'Timed Text Markup Language 2 (TTML2). W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml2-20181108/',
	},
	tt2t: {
		name: 'TTML2 transformation',
		designator: 'http://www.w3.org/ns/ttml/profile/ttml2-transformation',
		reference: 'Timed Text Markup Language 2 (TTML2). W3C Recommendation. 8 November 2018',
		url: 'https://www.w3.org/TR/2018/REC-ttml2-20181108/',
	},
};

// decode a single registered TTML profile identifier
// the decoded line is the profile name; the identifier and registry designator are added as fields for callers that use them
function decodeTTMLProfile(identifier) {
	const id = identifier.toLowerCase(),
		profile = TTML_PROFILES[id];
	if (!profile) return warning(`unknown TTML mode "${identifier}"`);
	return { ...normal(profile.name), identifier: id, designator: profile.designator };
}

// a profile expression combines identifiers: "+" means all of them apply and "|" means any one of the groups applies,
// with "+" taking precedence, so "A+B|C" means either both A and B, or C
// each decoded line is followed by an informative line with the registry designator of each profile it names
function decodeProfileExpression(expression) {
	const groups = expression.split('|').map((group) => group.split('+').map(decodeTTMLProfile));

	const designators = (group) =>
		group
			.filter((profile) => profile.designator)
			.map((profile) => ({ informative: group.length > 1 ? `${profile.decode}: ${profile.designator}` : profile.designator }));

	const describe = (group) => {
		if (group.length == 1) return [group[0], ...designators(group)];
		const line = `all of: ${group.map((profile) => profile.decode ?? profile.warning).join(' + ')}`;
		return [group.some((profile) => profile.warning) ? warning(line) : normal(line), ...designators(group)];
	};

	if (groups.length == 1) return describe(groups[0]);
	return [normal('one of the following:'), ...groups.flatMap(describe)];
}

export function decodeSTPP(val) {
	// the regex follows the registry grammar, so a missing or empty identifier, or anything after the profiles, is rejected
	const result = val.match(expressions.STPP.regex_grouped);
	if (!result || !result.groups) return [error('Regex mismatch!'), error(expressions.STPP.format), error(expressions.STPP.description)];

	const { format, profiles } = result.groups;
	if (!format) return [warning('generic XML timed text, no TTML profile is signalled')];
	if (!profiles) return [normal('generic timed text')];

	// https://www.w3.org/TR/ttml-profile-registry/
	return decodeProfileExpression(profiles);
}

export function registerText(addHandler) {
	const outputHTML = (label, messages) => simpleHTML(label, messages, DEBUGGING);

	addHandler('stpp', 'XML timed-text subtitles', decodeSTPP, outputHTML);
	addHandler('wvtt', 'WebVTT');
}
