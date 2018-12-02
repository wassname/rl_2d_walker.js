const path = require('path');
const webpack = require('webpack')

module.exports = {
  entry: {
    app: './src/index.js',
    // lib: './src/vendor/index.js'
  },
  target: 'web',
  devtool: 'dev-source-map',
  output: {
    path: path.join(__dirname), 
    filename: 'dist/[name].bundle.js',
    // path:'/dist',
  },
  devServer: {
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
    })
  ]
};
