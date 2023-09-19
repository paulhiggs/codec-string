const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
  common.webpackSettings({
    scriptLoading: 'module'
  }),
  {
    output: {
      path:  path.resolve(__dirname, 'dist/esm'),
      library: {
        type: "module"
      }
    },
    experiments: {
      outputModule: true
    },
    devServer: {
      "static": path.resolve(__dirname, './dist/esm'),
      allowedHosts: 'all',
      host: '0.0.0.0',
      hot: true
    }
  });
