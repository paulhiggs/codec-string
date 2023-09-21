// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";
let old = [
  "./src/decode-aac.js",
  "./src/decode-ac4.js",
  "./src/decode-av1.js",
  "./src/decode-avc.js",
  "./src/decode-avs.js",
  "./src/decode-evc.js",
  "./src/decode-hevc.js",
  "./src/decode-misc.js",
  "./src/decode-mpegH.js",
  "./src/decode-text.js",
  "./src/decode-vp9.js",
  "./src/decode-vvc.js",
];
const config = {
  entry: {
    home: "./src/decode.js",
  },
  sscanf: {
    home: "./src/sscanf-func.js",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/decode-codec.html",
    }),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        loader: "babel-loader",
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
