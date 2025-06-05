const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
	common.webpackSettings({
		scriptLoading: 'module',
	}),
	{
		output: {
			enabledLibraryTypes: ['module'],
			environment: { module: true },
			library: {
				type: 'module',
			},
			module: true,
			path: path.resolve(__dirname, 'dist/esm'),
		},
		experiments: {
			outputModule: true,
		},
		devServer: {
			static: path.resolve(__dirname, './tests'),
			allowedHosts: 'all',
			host: '0.0.0.0',
			hot: false,
		},
	}
);
