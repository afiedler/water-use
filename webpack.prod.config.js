var HtmlPlugin = require('html-webpack-plugin');

module.exports = {
  entry: "./frontend.js",
  output: {
    path: __dirname + '/public',
    filename: '[name]-[hash].min.js',
    publicPath: '/',
    sourcePrefix: ''
  },
  plugins: [
    new HtmlPlugin({
      template: 'index.html',
      inject : true,
      filename: 'index.html'
    })
  ],
  module: {
    unknownContextCritical: false,
    loaders: [
      { test: /\.css$/, loader: "style!css" },
      {
        test: /\.(png|gif|jpg|jpeg)$/,
        loader: 'file-loader'
      }
    ]
  }
};