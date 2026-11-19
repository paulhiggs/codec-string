/* globals describe, test, expect */
const { decode, decodeLCEVC, decodeSTPP, decodeUWA, simpleHTML } = require('../dist/cjs/codec-string.cjs');

describe('commonjs build test', () => {
	test('H.264 decode', () => {
		const result = decode('avc1.64002A');
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('AVC/H.264');
	});

	// VVC codec strings as used in practice: Main 10 profile with the constraint info '.CQA'
	// (ptl_frame_only_constraint_flag=1, ptl_multilayer_enabled_flag=0, gci_present_flag=0)
	const vvcDecodes = (codec) => {
		const result = decode(codec);
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('MPEG Versatile Video Coding');
		return result.decodes[0].parsed;
	};
	const decodeText = (parsed) => parsed.filter((p) => p.decode).map((p) => p.decode);
	const errors = (parsed) => parsed.filter((p) => p.error);
	const dvbTerm = (parsed) => parsed.find((p) => p.dvb_term)?.dvb_term;

	test('VVC decode vvc1.1.L51.CQA.O1+3 (ISO/IEC 14496-15 example)', () => {
		const parsed = vvcDecodes('vvc1.1.L51.CQA.O1+3');
		expect(errors(parsed)).toEqual([]);
		expect(decodeText(parsed)).toEqual([
			'Main 10',
			'Main Tier (L)',
			'Level 3.1',
			'ptl_frame_only_constraint_flag=true',
			'ptl_multilayer_enabled_flag=false',
			'gci_present_flag=false',
			"Output Layer Set index ('OlsIdx')=1",
			"Maximum Temporal Id ('MaxTid')=3",
		]);
	});

	test.each([
		['vvc1.1.L51', 'Level 3.1', '6.1.2'],
		['vvc1.1.L67.CQA', 'Level 4.1', '6.1.4'],
		['vvc1.1.L83.CQA', 'Level 5.1', '6.1.6'],
		['vvc1.1.L86.CQA', 'Level 5.2', '6.1.7'],
	])('VVC decode %s', (codec, level, term) => {
		const parsed = vvcDecodes(codec);
		expect(errors(parsed)).toEqual([]);
		expect(decodeText(parsed).slice(0, 3)).toEqual(['Main 10', 'Main Tier (L)', level]);
		expect(dvbTerm(parsed)).toEqual(`urn:dvb:metadata:cs:VideoCodecCS:2022:${term}`);
	});

	test('VVC decode vvi1.1.L83.CQA (parameter sets in band)', () => {
		const parsed = vvcDecodes('vvi1.1.L83.CQA');
		expect(errors(parsed)).toEqual([]);
		expect(decodeText(parsed).slice(0, 4)).toEqual(['Main 10', 'Main Tier (L)', 'Level 5.1', 'ptl_frame_only_constraint_flag=true']);
	});

	test.each(['vvc1.1.M51', 'vvc1.1', 'vvc1.1.L51.O+', 'vvc1.1.L51.C1'])('VVC rejects %s', (codec) => {
		expect(errors(vvcDecodes(codec))[0].error).toEqual('Regex mismatch!');
	});

	test('VVC decode vvc1.1.L51.SAAAAAAI+7777777 (sub-profiles are 7 base32 characters)', () => {
		const parsed = vvcDecodes('vvc1.1.L51.SAAAAAAI+7777777');
		expect(errors(parsed)).toEqual([]);
		expect(decodeText(parsed).slice(3)).toEqual(['Sub profile (1)=0x00000001 (1)', 'Sub profile (2)=0xFFFFFFFF (4294967295)']);
	});

	test.each(['vvc1.1.L51.SB', 'vvc1.1.L51.SAAAAAA', 'vvc1.1.L51.SAAAAAAAA', 'vvc1.1.L51.SAAAAAAI+B'])('VVC rejects sub-profile %s', (codec) => {
		expect(errors(vvcDecodes(codec))[0].error).toEqual('Regex mismatch!');
	});

	const warnings = (parsed) => parsed.filter((p) => p.warning).map((p) => p.warning);

	test('VVC warns about High Tier below Level 4.0', () => {
		const parsed = vvcDecodes('vvc1.1.H51');
		expect(decodeText(parsed)).toEqual(['Main 10', 'High Tier (H)', 'Level 3.1']);
		expect(warnings(parsed)).toEqual(['High Tier is not specified for Level 3.1, only for Level 4.0 and above']);
	});

	test.each(['vvc1.1.H64', 'vvc1.1.H83', 'vvc1.1.H255', 'vvc1.1.L51'])('VVC does not warn about the tier of %s', (codec) => {
		expect(warnings(vvcDecodes(codec))).toEqual([]);
	});

	test('VVC warns about MaxTid greater than 6', () => {
		const parsed = vvcDecodes('vvc1.1.L51.O0+7');
		expect(decodeText(parsed)).toContain("Maximum Temporal Id ('MaxTid')=7");
		expect(warnings(parsed)).toEqual(['MaxTid (7) is greater than 6']);
	});

	test.each(['vvc1.1.L51.O0+6', 'vvc1.1.L51.O+0', 'vvc1.1.L51.O9'])('VVC does not warn about the temporal layers of %s', (codec) => {
		expect(warnings(vvcDecodes(codec))).toEqual([]);
	});

	// HDR Vivid (T/UWA 005-2.1): each bit of the version map is one version, the lowest (rightmost) bit is version 1
	const cuvvDecodes = (codec) => {
		const result = decode(codec);
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('HDR Vivid');
		return result.decodes[0].parsed;
	};

	test.each([
		['cuvv.1', ['HDR Vivid version 1 is present']],
		['cuvv.0001', ['HDR Vivid version 1 is present']],
		['cuvv.1101', ['HDR Vivid version 4 is present', 'HDR Vivid version 3 is present', 'HDR Vivid version 1 is present']],
		['cuvv.1010', ['HDR Vivid version 4 is present', 'HDR Vivid version 2 is present']],
	])('HDR Vivid decode %s', (codec, versions) => {
		const parsed = cuvvDecodes(codec);
		expect(parsed.filter((p) => p.error || p.warning)).toEqual([]);
		expect(parsed.filter((p) => p.decode).map((p) => p.decode)).toEqual(versions);
	});

	test('HDR Vivid warns when no versions are present', () => {
		expect(cuvvDecodes('cuvv.0000').filter((p) => !p.dvb_term)).toEqual([{ warning: 'No HDR Vivid versions present' }]);
	});

	test.each(['cuvv.2', 'cuvv.', 'cuvv.01a'])('HDR Vivid rejects %s', (codec) => {
		const parsed = cuvvDecodes(codec);
		expect(parsed[0]).toEqual({ error: 'Regex mismatch!' });
		expect(parsed[1]).toEqual({ error: 'cuvv.<version_bits>' });
	});


	test('HDR Vivid decodeUWA rejects cuvvX1 (the . after cuvv is required)', () => {
		expect(decodeUWA('cuvvX1')[0]).toEqual({ error: 'Regex mismatch!' });
	});


	test.each(['cuvv.1', 'cuvv.1101', 'cuvv.0000'])('HDR Vivid %s maps to DVB VideoConformancePointsCS 2.3.4', (codec) => {
		expect(cuvvDecodes(codec).find((p) => p.dvb_term)?.dvb_term).toEqual('urn:dvb:metadata:cs:VideoConformancePointsCS:2026:2.3.4');
	});

	// XML timed text (stpp), with TTML profiles from the W3C TTML profile registry
	const stppDecodes = (codec) => {
		const result = decode(codec);
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('XML timed-text subtitles');
		return result.decodes[0].parsed;
	};
	const IMSC1_TEXT = 'http://www.w3.org/ns/ttml/profile/imsc1/text',
		EBU_TT_D = 'urn:ebu:tt:distribution:2014-01';

	test.each([
		['stpp', [{ warning: 'generic XML timed text, no TTML profile is signalled' }]],
		['stpp.ttml', [{ decode: 'generic timed text' }]],
		['stpp.ttml.foo', [{ warning: 'unknown TTML mode "foo"' }]],
	])('STPP decode %s', (codec, expected) => {
		expect(stppDecodes(codec)).toEqual(expected);
	});

	test('STPP decode stpp.ttml.im1t (name, identifier and designator)', () => {
		expect(stppDecodes('stpp.ttml.im1t')).toEqual([
			{ decode: 'IMSC1 text', identifier: 'im1t', designator: IMSC1_TEXT },
			{ informative: IMSC1_TEXT },
		]);
	});

	test.each([
		['etd1', 'EBU-TT-D 1.0'],
		['ede1', 'EBU-TT-D-Basic-DE (IRT)'],
		['im3t', 'IMSC1.2 text'],
		['IM1T', 'IMSC1 text'],
	])('STPP decode stpp.ttml.%s', (identifier, name) => {
		expect(stppDecodes(`stpp.ttml.${identifier}`)[0].decode).toEqual(name);
	});

	test.each([
		'cfi1', 'cft1', 'da1p', 'ede1', 'etd1', 'etd2', 'etl1', 'etx1', 'etx2', 'etx3', 'im1i', 'im1t', 'im2i',
		'im2t', 'im3t', 'im4t', 'nst1', 'rtp1', 'tt1f', 'tt1p', 'tt1s', 'tt1t', 'tt2f', 'tt2p', 'tt2t',
	])('STPP decodes registered TTML profile %s', (identifier) => {
		const parsed = stppDecodes(`stpp.ttml.${identifier}`);
		expect(parsed[0].identifier).toEqual(identifier);
		expect(parsed[0].designator).toBeTruthy();
		expect(parsed.filter((p) => p.warning || p.error)).toEqual([]);
	});

	test('STPP decode stpp.ttml.im1t|etd1 (any one of)', () => {
		expect(stppDecodes('stpp.ttml.im1t|etd1')).toEqual([
			{ decode: 'one of the following:' },
			{ decode: 'IMSC1 text', identifier: 'im1t', designator: IMSC1_TEXT },
			{ informative: IMSC1_TEXT },
			{ decode: 'EBU-TT-D 1.0', identifier: 'etd1', designator: EBU_TT_D },
			{ informative: EBU_TT_D },
		]);
	});

	test('STPP decode stpp.ttml.im1t+etd1 (all of)', () => {
		expect(stppDecodes('stpp.ttml.im1t+etd1')).toEqual([
			{ decode: 'all of: IMSC1 text + EBU-TT-D 1.0' },
			{ informative: `IMSC1 text: ${IMSC1_TEXT}` },
			{ informative: `EBU-TT-D 1.0: ${EBU_TT_D}` },
		]);
	});

	test('STPP warns about an unknown profile in a combination', () => {
		const parsed = stppDecodes('stpp.ttml.im1t+foo|etd1');
		expect(parsed[1]).toEqual({ warning: 'all of: IMSC1 text + unknown TTML mode "foo"' });
		expect(parsed.at(-2).decode).toEqual('EBU-TT-D 1.0');
	});

	test.each(['stpp.xyz', 'stpp.ttml.im1t.extra', 'stpp.ttml.im1t|', 'stpp.ttml.|im1t', 'stpp.ttml.im1t++etd1', 'stpp.ttml.', 'stpp.'])(
		'STPP rejects %s',
		(codec) => {
			expect(stppDecodes(codec)).toEqual([
				{ error: 'Regex mismatch!' },
				{ error: 'stpp{.ttml{.<profiles>}}' },
				{ error: '<profiles> is one or more TTML profile identifiers from the W3C TTML profile registry, joined by + (all of) or | (any one of)' },
			]);
		},
	);

	test('STPP decode stpp.ttml.im1t+etd1|im2t ("+" takes precedence over "|")', () => {
		const parsed = stppDecodes('stpp.ttml.im1t+etd1|im2t');
		expect(parsed.filter((p) => p.decode).map((p) => p.decode)).toEqual(['one of the following:', 'all of: IMSC1 text + EBU-TT-D 1.0', 'IMSC1.1 text']);
	});

	test('STPP HTML output shows the designator as an informative line', () => {
		const html = simpleHTML('XML timed-text subtitles', stppDecodes('stpp.ttml.im1t'));
		expect(html).toContain('IMSC1 text<br>');
		expect(html).toMatch(/font-style:italic[^>]*>http:\/\/www\.w3\.org\/ns\/ttml\/profile\/imsc1\/text</);
	});

	test('STPP decodeSTPP can be called directly', () => {
		expect(decodeSTPP('stpp.ttml.etd1')[0]).toEqual({ decode: 'EBU-TT-D 1.0', identifier: 'etd1', designator: EBU_TT_D });
	});

	// LCEVC codec strings, ISO/IEC 14496-15:2025 annex E.10 (keys 'vprf' and 'vlev', defaults 0 and 4)
	const lcevcDecodes = (codec) => {
		const result = decode(codec);
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('MPEG Low Complexity Enhancement Video Coding');
		return result.decodes[0].parsed;
	};
	const LCEVC_MAIN_DEFAULT = { name: 'Profile (vprf)', is_default: true, value: 0, description: 'Main profile' };
	const LCEVC_LEVEL4_DEFAULT = { name: 'Level (vlev)', is_default: true, value: 4, description: 'Level 4' };

	test('LCEVC decode lvc1 uses the default profile and level', () => {
		expect(lcevcDecodes('lvc1')).toEqual([LCEVC_MAIN_DEFAULT, LCEVC_LEVEL4_DEFAULT]);
	});

	test('LCEVC decode lvc1.vprf0.vlev1 (annex E.10 example)', () => {
		expect(lcevcDecodes('lvc1.vprf0.vlev1')).toEqual([
			{ name: 'Profile (vprf)', is_default: false, value: 0, description: 'Main profile' },
			{ name: 'Level (vlev)', is_default: false, value: 1, description: 'Level 1' },
		]);
	});

	test('LCEVC decode lvc1.vprf1.vlev2', () => {
		expect(lcevcDecodes('lvc1.vprf1.vlev2')).toEqual([
			{ name: 'Profile (vprf)', is_default: false, value: 1, description: 'Main 4:4:4 profile' },
			{ name: 'Level (vlev)', is_default: false, value: 2, description: 'Level 2' },
		]);
	});

	test('LCEVC keys are case sensitive', () => {
		expect(lcevcDecodes('lvc1.VPRF1.VLEV2')).toEqual([
			{ error: 'key VPRF is not permitted, keys are case sensitive (use vprf)' },
			{ error: 'key VLEV is not permitted, keys are case sensitive (use vlev)' },
			LCEVC_MAIN_DEFAULT,
			LCEVC_LEVEL4_DEFAULT,
		]);
	});

	test('LCEVC rejects a duplicate key', () => {
		expect(lcevcDecodes('lvc1.vprf1.vprf0')[0]).toEqual({ error: 'key vprf can only be provided once' });
	});

	test('LCEVC reports an invalid profile and level', () => {
		expect(lcevcDecodes('lvc1.vprf7')[0].description).toEqual({ error: 'invalid profile (7), profiles 0 and 1 are defined' });
		expect(lcevcDecodes('lvc1.vlev9')[1].description).toEqual({ error: 'invalid level (9), levels 1 to 4 are defined' });
	});

	test('LCEVC rejects a non-numeric value', () => {
		expect(lcevcDecodes('lvc1.vprfx')[0].error).toMatch(/^invalid value for key=vprf \(x\)/);
	});

	test('LCEVC warns about an unrecognised key and reports an empty key', () => {
		expect(lcevcDecodes('lvc1.abcd5')).toEqual([{ warning: 'unrecognised key (abcd), the meaning of its value (5) cannot be determined' }, LCEVC_MAIN_DEFAULT, LCEVC_LEVEL4_DEFAULT]);
		expect(lcevcDecodes('lvc1.')[0]).toEqual({ error: 'empty key at position 1, keys are separated by a single "."' });
		expect(lcevcDecodes('lvc1.ab')[0]).toEqual({ error: 'invalid key (ab), keys are four characters followed by the value' });
	});

	test('LCEVC decodeLCEVC can be called directly', () => {
		expect(decodeLCEVC('lvc1.vlev3')[1]).toEqual({ name: 'Level (vlev)', is_default: false, value: 3, description: 'Level 3' });
	});
});
