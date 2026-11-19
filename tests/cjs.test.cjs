/* globals describe, test, expect */
const { decode } = require('../dist/cjs/codec-string.cjs');

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
});
