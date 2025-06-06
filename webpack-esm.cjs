const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
	common.webpackSettings({
		clean: true,
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
			static: [
				{
					directory: path.resolve(__dirname, './tests'),
					publicPath: '/tests',
					serveIndex: true,
				  watch: true,
			  },
				{
					directory: path.resolve(__dirname, './dist'),
					publicPath: '/dist',
					watch: true,
				}
			],
			allowedHosts: 'all',
			host: '0.0.0.0',
			hot: false,
		},
	}
);
