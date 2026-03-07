const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: "development",

  entry: "./src/home-purchase-ca.js",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true
  },

  devServer: {
    static: "./dist",
    open: true,
    port: 3000,
    hot: true
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader","css-loader"]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        // Let Webpack parse ES modules natively
        type: 'javascript/esm'
      }
    ]
  },

  resolve: {
    extensions: ['.js']
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/home-purchase-ca.html",
      inject: "body"
    })
  ]
};