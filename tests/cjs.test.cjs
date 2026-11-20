/* globals describe, test, expect */
const { decode, decodeHEVC, decodeHEVCLayerInfo, decodeLCEVC, decodeSTPP, decodeUWA, expressions, simpleHTML } = require('../dist/cjs/codec-string.cjs');

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

	// LCEVC and EVC share the keyValueHTML() table formatter
	test('LCEVC HTML output is a key/value table', () => {
		const html = decode('lvc1.vprf1.vlev2.abcd5').decodes[0].toHTML();
		expect(html).toContain('<tr><td>Profile (vprf)</td><td>1</td><td>Main 4:4:4 profile</td><td></td></tr>');
		expect(html).toContain('<tr><td>Level (vlev)</td><td>2</td><td>Level 2</td><td></td></tr>');
		expect(html).toMatch(/<td colspan="4"><span style="color:orange">unrecognised key \(abcd\)/);
		expect(html).not.toContain('nth-child(even)');
	});

	test('LCEVC HTML output marks default values and shows errors', () => {
		const html = decode('lvc1.vprf7').decodes[0].toHTML();
		expect(html).toContain('<td><span style="color:red">invalid profile (7), profiles 0 and 1 are defined</span></td>');
		expect(html).toContain('<td>Level 4</td><td><span style="font-style:italic">default</span></td>');
	});

	test('EVC HTML output keeps the toolset rows and zebra striping', () => {
		const html = decode('evc1.vprf1.vtoh000001').decodes[0].toHTML();
		expect(html).toContain('tr:nth-child(even) {background-color: #f2f2f2;}');
		expect(html).toContain('<td>Toolset High (vtoh)</td><td>0x000001</td>');
	});

	// HEVC codec strings, ISO/IEC 14496-15 annex E.3 and Rec. ITU-T H.265 (V11)
	const hevcDecodes = (codec) => {
		const result = decode(codec);
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('HEVC/H.265');
		return result.decodes[0].parsed;
	};

	test('HEVC decode hvc1.1.6.L93.B0', () => {
		const parsed = hevcDecodes('hvc1.1.6.L93.B0');
		expect(errors(parsed)).toEqual([]);
		expect(warnings(parsed)).toEqual([]);
		expect(decodeText(parsed)).toEqual(expect.arrayContaining(['general_profile_space=0', 'general_profile_idc=Main (1)', 'Main Tier (L)', 'Level 3.1', 'scan=progressive']));
	});

	// #69: the High tier is only specified for level 4 and above (H.265 annex A.4.1)
	test.each([
		['hvc1.1.6.H60.B0', 'High Tier is not specified for Level 2, only for Level 4 and above'],
		['hvc1.1.6.H93.B0', 'High Tier is not specified for Level 3.1, only for Level 4 and above'],
	])('HEVC warns about the High tier below level 4 (%s)', (codec, warning) => {
		expect(warnings(hevcDecodes(codec))).toEqual([warning]);
	});

	test.each(['hvc1.1.6.H120.B0', 'hvc1.1.6.L60.B0'])('HEVC does not warn about the tier for %s', (codec) => {
		expect(warnings(hevcDecodes(codec))).toEqual([]);
	});

	// #62: general_profile_space is no character or 'A', 'B', 'C' (ISO/IEC 14496-15 annex E.3)
	test.each([
		['hvc1.A1.6.L93.B0', 1],
		['hvc1.B1.6.L93.B0', 2],
		['hvc1.C1.6.L93.B0', 3],
	])('HEVC decodes the profile space in %s', (codec, space) => {
		const parsed = hevcDecodes(codec);
		expect(warnings(parsed)).toEqual([]);
		expect(decodeText(parsed)).toContain(`general_profile_space=${space}`);
		expect(decodeText(parsed)).toContain('general_profile_idc=Main (1)');
	});

	test('HEVC accepts a lowercase profile space with a warning', () => {
		const parsed = hevcDecodes('hvc1.a1.6.L93.B0');
		expect(decodeText(parsed)).toContain('general_profile_space=1');
		expect(decodeText(parsed)).toContain('general_profile_idc=Main (1)');
		expect(warnings(parsed)).toEqual(['general_profile_space should be uppercase (A), not a']);
	});

	test.each(['D1', '1x', 'A'])('HEVC rejects the profile %s', (profile) => {
		expect(hevcDecodes(`hvc1.${profile}.6.L93.B0`)).toEqual([
			{ error: `invalid general_profile_space and general_profile_idc (${profile}), expected an optional A, B or C followed by a decimal number` },
		]);
	});

	// #59: the constraint bit after general_lower_bit_rate_constraint_flag
	test('HEVC labels general_max_14bit_constraint_flag', () => {
		const text = decodeText(hevcDecodes('hvc1.5.20.L93.B0.04'));
		expect(text).toContain('general_max_14bit_constraint_flag=1');
		expect(text.filter((t) => t.startsWith('general_max_12bit_constraint_flag='))).toEqual(['general_max_12bit_constraint_flag=0']);
	});

	// #65: profile names from Rec. ITU-T H.265 (V11) annexes G and H
	test.each([
		['hvc1.6.40.L93.BE', 'Multiview Main (6)'],
		['hvc1.6.40.L93.BC', 'Multiview Main 10 (6)'],
		['hvc1.7.80.L93.BE', 'Scalable Main (7)'],
		['hvc1.7.80.L93.BC', 'Scalable Main 10 (7)'],
		['hvc1.10.400.L93.B0', 'Scalable Format Range Extensions (10)'],
		['hvc1.12.1000.L93.B0', 'Multiview Extended (12)'],
		['hvc1.13.2000.L93.B0', 'Multiview Extended 10 (13)'],
		['hvc1.14.4000.L93.B0', 'Multiview Format Range Extensions (14)'],
	])('HEVC profile name for %s', (codec, name) => {
		const parsed = hevcDecodes(codec);
		expect(errors(parsed)).toEqual([]);
		expect(decodeText(parsed)).toContain(`general_profile_idc=${name}`);
	});

	test('HEVC decodeHEVC can be called directly', () => {
		expect(decodeHEVC('hvc1.1.6.L93.B0')).toContainEqual({ decode: 'general_profile_idc=Main (1)' });
	});

	// #66: general_level_idc is 30 times the level number (H.265 table A.8)
	test.each([
		[30, '1'], [60, '2'], [63, '2.1'], [90, '3'], [93, '3.1'], [120, '4'], [123, '4.1'],
		[150, '5'], [153, '5.1'], [156, '5.2'], [180, '6'], [183, '6.1'], [186, '6.2'],
		[189, '6.3'], [210, '7'], [213, '7.1'], [216, '7.2'],
	])('HEVC general_level_idc %i is Level %s', (idc, level) => {
		const parsed = hevcDecodes(`hvc1.1.6.L${idc}.B0`);
		expect(errors(parsed)).toEqual([]);
		expect(decodeText(parsed)).toContain(`Level ${level}`);
	});

	// #64: level 8.5 is not in table A.8, and requires the High tier (H.265 annex A.4.1)
	test('HEVC decodes level 8.5', () => {
		const parsed = hevcDecodes('hvc1.1.6.H255.B0');
		expect(errors(parsed)).toEqual([]);
		expect(warnings(parsed)).toEqual([]);
		expect(decodeText(parsed)).toContain('Level 8.5');
	});

	test('HEVC warns about level 8.5 with the Main tier', () => {
		const parsed = hevcDecodes('hvc1.1.6.L255.B0');
		expect(decodeText(parsed)).toContain('Level 8.5');
		expect(warnings(parsed)).toEqual(['Level 8.5 requires the High Tier (H)']);
	});

	test('HEVC reports an unknown level', () => {
		const parsed = hevcDecodes('hvc1.1.6.L91.B0');
		expect(errors(parsed)).toEqual([{ error: 'unknown Level (91)' }]);
		expect(decodeText(parsed).filter((t) => t.startsWith('Level '))).toEqual([]);
	});

	// #71: expressions.HEVC accepts every sample entry type registered for HEVC (not used by decodeHEVC() yet)
	test.each(['hev1', 'hvc1', 'hev2', 'hvc2', 'hev3', 'hvc3'])('HEVC regex accepts %s', (fourCC) => {
		expect(expressions.HEVC.regex.test(`${fourCC}.1.6.L93.B0`)).toBe(true);
	});

	test.each(['hev4', 'hvc0', 'lhv1', 'avc1'])('HEVC regex rejects %s', (fourCC) => {
		expect(expressions.HEVC.regex.test(`${fourCC}.1.6.L93.B0`)).toBe(false);
	});

	// #71: the profile part is an optional general_profile_space letter A, B or C (lowercase is accepted, see #62)
	test.each(['1', 'A1', 'B2', 'C3', 'a1', 'c3'])('HEVC regex accepts the profile %s', (profile) => {
		expect(expressions.HEVC.regex.test(`hvc1.${profile}.6.L93.B0`)).toBe(true);
	});

	test.each(['D1', 'z1', 'AA1', 'A'])('HEVC regex rejects the profile %s', (profile) => {
		expect(expressions.HEVC.regex.test(`hvc1.${profile}.6.L93.B0`)).toBe(false);
	});

	// #60: no stray quote in the general_one_picture_only_constraint_flag output
	test.each([
		['hvc1.4.10.L93.B0', 'general_one_picture_only_constraint_flag=0'],
		['hvc1.4.10.L93.B0.10', 'general_one_picture_only_constraint_flag=1'],
		['hvc1.2.4.L93.B0.10', 'general_one_picture_only_constraint_flag=1'],
	])('HEVC shows general_one_picture_only_constraint_flag for %s', (codec, flag) => {
		const text = decodeText(hevcDecodes(codec));
		expect(text).toContain(flag);
		expect(text.filter((t) => t.includes('"'))).toEqual([]);
	});

	// #61: lhevcptl is a MIME parameter, so a bare lhv1 or lhe1 in a codecs string has no PTL information
	test.each(['lhv1', 'lhe1'])('Layered HEVC %s without lhevcptl does not throw', (fourCC) => {
		const result = decode(`hev1.1.6.L93.B0, ${fourCC}`);
		expect(result.decodes.length).toEqual(2);
		expect(result.decodes[0].label).toEqual('HEVC/H.265');
		expect(result.decodes[1].label).toEqual('Layered HEVC');
		expect(result.decodes[1].parsed).toEqual([{ informative: 'no LHEVC ProfileTierLevel information' }]);
	});

	test('Layered HEVC decodes BLInternal from the lhevcptl MIME parameter (ISO/IEC 14496-15 example)', () => {
		const parsed = decodeHEVCLayerInfo('codecs="hev1.1.6.L93.B0, lhv1"; lhevcptl="1, 1.6.1.6.L93.B0.0.0.0.0.0.7.80.L120.BF.88"');
		expect(parsed[0]).toEqual({ decode: 'Coded pictures with nuh_layer_id==0 may be present in the bitstream.' });
		expect(parsed.length).toEqual(2);
	});

	// #70: when the sample entry in a codecs list item is lhv1 or lhe1, no further data is provided in that list item (ISO/IEC 14496-15 clause E.4)
	test.each([
		['lhv1.1.6.L93.B0', 'no further data is permitted after lhv1 (1.6.L93.B0), use the lhevcptl MIME parameter'],
		['lhe1.7.80.L120.BF', 'no further data is permitted after lhe1 (7.80.L120.BF), use the lhevcptl MIME parameter'],
	])('Layered HEVC warns about data after the sample entry in %s', (codec, warning) => {
		const result = decode(codec);
		expect(result.decodes[0].label).toEqual('Layered HEVC');
		expect(result.decodes[0].parsed).toEqual([{ warning }, { informative: 'no LHEVC ProfileTierLevel information' }]);
	});

	// #68: format range extensions profiles from the constraint flags (H.265 table A.2)
	// rextConstraints() builds the first two constraint bytes: progressive, non-packed and frame-only, then the eight
	// table A.2 flags (general_max_12bit ... general_one_picture_only) and general_lower_bit_rate_constraint_flag
	const rextConstraints = (flags, lowerBitRate) => {
		const bits = `1011${flags}${lowerBitRate}000`;
		return [bits.slice(0, 8), bits.slice(8)].map((b) => parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0')).join('.');
	};
	const rextProfiles = [
		['Monochrome', '11111100', false], ['Monochrome 10', '11011100', false], ['Monochrome 12', '10011100', false],
		['Monochrome 16', '00011100', false], ['Main 12', '10011000', false], ['Main 4:2:2 10', '11010000', false],
		['Main 4:2:2 12', '10010000', false], ['Main 4:4:4', '11100000', false], ['Main 4:4:4 10', '11000000', false],
		['Main 4:4:4 12', '10000000', false], ['Main Intra', '11111010', true], ['Main 10 Intra', '11011010', true],
		['Main 12 Intra', '10011010', true], ['Main 4:2:2 10 Intra', '11010010', true], ['Main 4:2:2 12 Intra', '10010010', true],
		['Main 4:4:4 Intra', '11100010', true], ['Main 4:4:4 10 Intra', '11000010', true], ['Main 4:4:4 12 Intra', '10000010', true],
		['Main 4:4:4 16 Intra', '00000010', true], ['Main 4:4:4 Still Picture', '11100011', true], ['Main 4:4:4 16 Still Picture', '00000011', true],
	];

	test('HEVC rextConstraints() builds the expected constraint bytes', () => {
		expect(rextConstraints('10011000', 1)).toEqual('B9.88');
	});

	test.each(rextProfiles)('HEVC format range extensions profile %s', (name, flags, anyLowerBitRate) => {
		const parsed = hevcDecodes(`hvc1.4.10.L93.${rextConstraints(flags, 1)}`);
		expect(warnings(parsed)).toEqual([]);
		expect(decodeText(parsed)).toContain(`general_profile_idc=${name} (4)`);

		// general_lower_bit_rate_constraint_flag can only be 0 for the Intra and Still Picture profiles
		const lowerBitRate0 = hevcDecodes(`hvc1.4.10.L93.${rextConstraints(flags, 0)}`);
		if (anyLowerBitRate) {
			expect(warnings(lowerBitRate0)).toEqual([]);
			expect(decodeText(lowerBitRate0)).toContain(`general_profile_idc=${name} (4)`);
		} else {
			expect(decodeText(lowerBitRate0)).toContain('general_profile_idc=Format Range Extensions (4)');
			expect(warnings(lowerBitRate0)).toEqual([
				`the constraint flags (${flags}, general_lower_bit_rate_constraint_flag=0) do not identify a format range extensions profile in Table A.2`,
			]);
		}
	});

	test.each(['11111111', '00000000', '01111100'])('HEVC warns about the reserved format range extensions flags %s', (flags) => {
		const parsed = hevcDecodes(`hvc1.4.10.L93.${rextConstraints(flags, 1)}`);
		expect(decodeText(parsed)).toContain('general_profile_idc=Format Range Extensions (4)');
		expect(warnings(parsed)).toEqual([
			`the constraint flags (${flags}, general_lower_bit_rate_constraint_flag=1) do not identify a format range extensions profile in Table A.2`,
		]);
	});

	// #57: general_profile_compatibility_flag[ j ] is bit j of the hexadecimal value (H.265 clause 7.4.4, ISO/IEC 14496-15 clause E.4)
	// #58: the profile is given by general_profile_idc, the compatibility flags are only used when it is not a known profile
	const informative = (parsed) => parsed.filter((p) => p.informative).map((p) => p.informative);
	test.each([
		['hvc1.1.6.L93.B0', 'Main (1)', 'Main (1), Main 10 (2)'],
		['hvc1.2.4.L153.B0', 'Main 10 (2)', 'Main 10 (2)'],
		['hvc1.2.6.L93.B0', 'Main 10 (2)', 'Main (1), Main 10 (2)'],
		['hvc1.4.4.L93.B9.88', 'Main 12 (4)', 'Main 10 (2)'],
		['hvc1.7.82.L120.BF.88', 'Scalable Main (7)', 'Main (1), Scalable Main (7)'],
	])('HEVC takes the profile of %s from general_profile_idc', (codec, name, compatible) => {
		const parsed = hevcDecodes(codec);
		expect(errors(parsed)).toEqual([]);
		expect(decodeText(parsed)).toContain(`general_profile_idc=${name}`);
		expect(informative(parsed)).toContain(`compatible profiles: ${compatible}`);
		expect(informative(parsed).filter((i) => i.includes('is not a known profile'))).toEqual([]);
	});

	test.each([
		['hvc1.0.2.L93.B0', 'Main (1)', 0, 1, 'urn:dvb:metadata:cs:VideoCodecCS:2022:4.1.10'],
		['hvc1.0.4.L93.B0', 'Main 10 (2)', 0, 2, 'urn:dvb:metadata:cs:VideoCodecCS:2022:4.2.10'],
		['hvc1.20.2.L93.B0', 'Main (1)', 20, 1, 'urn:dvb:metadata:cs:VideoCodecCS:2022:4.1.10'],
	])('HEVC takes the profile of %s from the compatibility flags', (codec, name, idc, flag, dvb) => {
		const parsed = hevcDecodes(codec);
		expect(decodeText(parsed)).toContain(`general_profile_idc=${name}`);
		expect(informative(parsed)).toContain(`general_profile_idc (${idc}) is not a known profile, the profile is taken from general_profile_compatibility_flag[ ${flag} ]`);
		expect(dvbTerm(parsed)).toEqual(dvb);
	});

	test('HEVC reports an unknown profile', () => {
		expect(errors(hevcDecodes('hvc1.0.0.L93.B0'))).toEqual([{ error: 'unknown profile (0)' }]);
		const parsed = hevcDecodes('hvc1.20.10000.L93.B0');
		expect(errors(parsed)).toEqual([{ error: 'unknown profile (20)' }]);
		expect(informative(parsed)).toContain('compatible profiles: reserved (16)');
	});

	// the profile_tier_level( ) conditions in H.265 clause 7.3.3 use general_profile_compatibility_flag[ j ]
	test('HEVC shows the constraint flags for the profiles the compatibility flags signal', () => {
		// Main only: no general_one_picture_only_constraint_flag (general_reserved_zero_43bits)
		expect(decodeText(hevcDecodes('hvc1.1.2.L93.B0')).filter((t) => t.startsWith('general_one_picture_only'))).toEqual([]);
		// Main, compatible with Main 10: general_one_picture_only_constraint_flag is present
		expect(decodeText(hevcDecodes('hvc1.1.6.L93.B0'))).toContain('general_one_picture_only_constraint_flag=0');
		// format range extensions: general_max_14bit_constraint_flag is not present (general_reserved_zero_34bits)
		const rext = decodeText(hevcDecodes('hvc1.4.10.L93.B9.88'));
		expect(rext).toContain('general_max_12bit_constraint_flag=1');
		expect(rext.filter((t) => t.startsWith('general_max_14bit'))).toEqual([]);
	});
});
