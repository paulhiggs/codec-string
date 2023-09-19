const path = require('path');

const { merge } = require('webpack-merge');

const common = require('./webpack.common.cjs');

module.exports = merge(
  common.webpackSettings({
    scriptLoading: 'blocking'
  }), {
    entry : {
      "codec-string": "./src/global/codec-string.js",
      app: {
        dependOn: "codec-string",
        "import": "./src/global/app.js"
      }
    },
    output: {
      path:  path.resolve(__dirname, 'dist/dflt'),
      library: {
        type: "module"
      }
    },
    experiments: {
      outputModule: true
    }
  });
