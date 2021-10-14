const path = require("path");
const common = require("./webpack.common");
const { merge } = require ("webpack-merge");
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
	mode: "development",
	plugins: [
	new HtmlWebpackPlugin({
		template: "./pre/template.html"
	})],
	module: {
	    rules: [
		    {
		      test: /\.scss$/i,
		      use: ['style-loader', 'css-loader', 'sass-loader']
		    },
		]
	}
});