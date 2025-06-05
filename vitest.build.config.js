import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: true,
		include: [
			'tests/esm.test.js',
			'tests/cjs.test.cjs',
		],
	},
});
