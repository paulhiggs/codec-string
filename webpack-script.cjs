const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
	common.webpackSettings({
		scriptLoading: 'blocking',
	}),
	{
		entry: {
			// only the library entry sets window.CodecString: if app set it as well, app's empty exports would replace the library
			'codec-string': {
				import: './src/index.cjs',
				library: {
					name: 'CodecString',
					type: 'window',
				},
			},
			app: {
				dependOn: 'codec-string',
				import: './src/global/app.js',
			},
		},
		output: {
			enabledLibraryTypes: ['window'],
			path: path.resolve(__dirname, 'dist/script'),
		},
		// no experiments.outputModule here: this build is loaded with plain <script> tags and sets window.CodecString,
		// so it must not contain ES module syntax (export / import)
	}
);
