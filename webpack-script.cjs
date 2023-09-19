const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
  common.webpackSettings({
    scriptLoading: 'blocking'
  }), {
    entry : {
      "codec-string": "./src/index.cjs",
      app: {
        dependOn: "codec-string",
        "import": "./src/global/app.js"
      }
    },
    output: {
      path:  path.resolve(__dirname, 'dist/script'),
      library: {
        name: 'CodecString',
        type: 'window'
      }
    },
    experiments: {
      outputModule: true
    }
  });
