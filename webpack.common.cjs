const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


const webpackSettings = ({ scriptLoading } ) => ({
  entry : {
    "codec-string": "./src/decode.js",
    app: {
      dependOn: "codec-string",
      "import": "./src/app.js"
    }
  },
  mode: "none",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ESLintPlugin(),
    new HtmlWebpackPlugin({
      title: 'Codec string decoder',
      template: './src/index.ejs',
      filename: 'index.html',
      cache: false,
      chunksSortMode: 'none',
      chunks: ['codec-string', 'app'],
      hash: true,
      inject: 'head',
      scriptLoading
    })
  ],
  output: {
    filename: `[name].js`
  }
});

module.exports = {
  webpackSettings
};
