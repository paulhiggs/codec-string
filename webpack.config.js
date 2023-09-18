const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'codec-string': path.resolve(__dirname, './src/decode.js'),
    app: {
      dependOn: 'codec-string',
      import: path.resolve(__dirname, './src/app.js'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: ['ts-loader'],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
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
    })
  ],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].min.js'
  },
  devServer: {
    static: path.resolve(__dirname, './dist'),
    allowedHosts: 'all',
    host: '0.0.0.0',
    hot: true
  }
};
