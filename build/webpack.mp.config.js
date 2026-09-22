const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MpPlugin = require('mp-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve(__dirname, '../wechat-src/index.mp.js'),
  },
  output: {
    path: path.resolve(__dirname, '../dist/mp/common'),
    library: 'createApp',
    libraryExport: 'default',
    libraryTarget: 'window',
  },
  target: 'web',
  optimization: {
    runtimeChunk: false,
    splitChunks: {
      chunks: 'all',
      minSize: 0,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 100,
      maxInitialRequests: 100,
      automaticNameDelimiter: '~',
      name: false,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { url: false },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.json'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.isMiniprogram': JSON.stringify(true),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].wxss',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../assets'),
          to: 'assets',
        },
      ],
    }),
    new MpPlugin(require('./miniprogram.config.js')),
  ],
}
