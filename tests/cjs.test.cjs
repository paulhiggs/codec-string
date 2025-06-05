/* globals describe, test, expect */
const { decode } = require('../dist/cjs/codec-string.cjs');

describe('commonjs build test', () => {
	test('H.264 decode', () => {
		const result = decode('avc1.64002A');
		expect(result).toBeDefined();
		expect(result.decodes.length).toEqual(1);
		expect(result.decodes[0].label).toEqual('AVC/H.264');
	});
});
