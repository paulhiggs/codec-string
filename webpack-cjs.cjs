const path = require('path');
const DelWebpackPlugin = require('del-webpack-plugin');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
	common.webpackSettings({
		chunks: ['codec-string'],
		scriptLoading: 'defer',
	}),
	{
		output: {
			enabledLibraryTypes: ['commonjs'],
			path: path.resolve(__dirname, 'dist/cjs'),
			library: {
				type: 'commonjs',
			},
			filename: `[name].cjs`,
			globalObject: 'this',
		},
		plugins: [
			new DelWebpackPlugin({
				include: ['index.html', 'app.cjs'],
				info: false,
				keepGeneratedAssets: false,
			}),
		],
	}
);
