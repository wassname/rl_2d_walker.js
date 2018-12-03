const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')

var ENV = process.env.NODE_ENV || "development";

module.exports = {
  entry: {
    app: './src/index.js',
    // lib: './src/vendor/index.js'
  },
  target: 'web',
  devtool: ENV==="development"? 'dev-source-map': null,
  output: {
    path: path.join(__dirname, 'dist'), 
    filename: '[name].bundle.js',
    // path:'/dist',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        lib: {
          test: /jsbox2d/,
          chunks: 'initial',
          name: 'lib',
          priority:20,
          enforce:true
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true,
        }
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      // A flag to disable node imports, and enable window/dom usage
      WEB: true
    }),
    new HtmlWebpackPlugin({ template: '!!html-loader!src/index.html' }),
    new CopyWebpackPlugin([
      { from: 'src/images', to: 'images' },
      {from:'checkpoints',to:'checkpoints'}
      
  ]), 
    
  ]
};
