const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')

var ENV = process.env.NODE_ENV || "development";

module.exports = {
  entry: {
    app: './src/index.js',
  },
  target: 'web',
  devtool: ENV==="development"? 'dev-source-map': false,
  output: {
    path: path.join(__dirname, 'dist'), 
    filename: '[name].bundle.js',
  },
  optimization: {
    usedExports: true,
    splitChunks: {
      cacheGroups: {
        box2d: {
          test: /jsbox2d/,
          chunks: 'initial',
          name: 'box2d',
          priority:20,
          enforce:true
        },
        tfjs: {
          test: /[\\/]node_modules[\\/]\@tensorflow/,
          chunks: 'initial',
          name: 'tfjs',
          priority: 15,
          enforce: true,
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
    new HtmlWebpackPlugin({ template: '!!html-loader!src/index.html' }),
    new CopyWebpackPlugin([
      { from: 'src/images', to: 'images' },
      { from: 'checkpoints', to: 'checkpoints' },
      {from:'src/css',to:'css'}
      
  ]), 
  new webpack.DefinePlugin({
    // A flag to disable node imports, and enable window/dom usage
    WEB: true
  }),
  ]
};

