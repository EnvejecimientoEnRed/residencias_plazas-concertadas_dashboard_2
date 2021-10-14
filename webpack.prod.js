const path = require("path");
const common = require("./webpack.common");
const { merge } = require ("webpack-merge");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(common, {
	mode: "production",
	output: {
		filename: "main.[contentHash].js",
		path: path.resolve(__dirname, "docs/")
	},
	optimization: {
		minimizer: [
			new UglifyJsPlugin(),
            new HtmlWebpackPlugin({
                template: "./pre/template.html",
                minify: {
                    removeAttributeQuotes: true,
                    collapseWhitespace: true,
                    removeComments: true
                }
            })
	    ]
	},
	plugins: [
	    new MiniCssExtractPlugin({filename: '[name].[contentHash].css'}),
	    new CleanWebpackPlugin()
	],
	module: {
	    rules: [
	      {
	        test: /\.scss$/i,
	        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
	      },
	    ],
	},
});