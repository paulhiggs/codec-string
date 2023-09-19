const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
  common.webpackSettings({
    scriptLoading: 'defer'
  }), {
    output: {
      path:  path.resolve(__dirname, 'dist/cjs'),
      library: {
        type: 'commonjs'
      }
    }
  });
