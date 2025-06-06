import { describe, test, expect } from 'vitest';

import { decode } from './index.js';

describe('ESM index test', () => {
	test('H.264 decode', () => {
		const result = decode('avc1.64002A');
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('AVC/H.264');
		expect(result.decodes[0].parsed).toEqual([
			{ decode: 'profile_idc=100 constraint_set=0 level_idc=42' },
			{ decode: 'profile=High (64)' },
			{ decode: 'constraints=------' },
			{ decode: 'level=4.2 (2a)' },
			{ dvb_term: 'urn:dvb:metadata:cs:VideoCodecCS:2022:1.4.14' }
		]);
	});

	test("AAC decode", () => {
		const result = decode("mp4a.40.2");
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('AAC');
		expect(result.decodes[0].parsed).toEqual([
			{ decode: 'MPEG-4 AAC (40)' },
			{ decode: 'Low-Complexity AAC (2)' }
		]);
	});

});
