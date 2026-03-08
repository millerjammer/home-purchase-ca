const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  
  entry: "./src/home-purchase-ca.js",

  output: {
    filename: "ca-home-purchase.js",         // rename JS output
    path: path.resolve(__dirname, "dist"),
    clean: true
  },

  devServer: {
    static: "./dist",
    open: 'home-purchase-ca.html',
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
        test: /\.js$/i,
        exclude: /node_modules/,
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
      filename: "home-purchase-ca.html",      // rename HTML output
      inject: "body"
    })
  ]
};