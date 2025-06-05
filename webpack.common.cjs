//const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const  package_json = require('./package.json');

const webpackSettings = ({ scriptLoading }) => ({
	entry: {
		'codec-string': './src/index.js',
		app: {
			dependOn: 'codec-string',
			import: './src/app.js',
		},
	},
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: ['babel-loader'],
			},
		],
	},
	resolve: {
		extensions: ['*', '.js'],
	},
	plugins: [
		new CleanWebpackPlugin(),
		new ESLintPlugin(),
		new HtmlWebpackPlugin({
			title: 'Codec string decoder (parse+print mode)',
			author: 'Paul Higgs',
			author_email: package_json.author,
			repo: package_json.repository.url,
			issues: `${package_json.repository.url}/issues`,
			product: package_json.name,
			version:  package_json.version,
			template: './src/index.html.ejs',
			filename: 'index.html',
			cache: false,
			chunksSortMode: 'none',
			chunks: ['codec-string', 'app'],
			hash: true,
			inject: 'head',
			scriptLoading,
		}),
	],
	output: {
		filename: `[name].js`,
		globalObject: 'self',
	},
});

module.exports = {
	webpackSettings,
};
