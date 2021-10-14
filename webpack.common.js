const path = require("path");

module.exports = {
	entry: "./pre/js/main.js",
	module: {
	    rules: [
		    {
				test: /\.html$/i,
				use: ['html-loader']
			},
			{
				test: /\.(svg|png|jpe?g|gif)$/,
				use: {
					loader: "file-loader",
					options: {
						name: "[name].[hash].[ext]",
						outputPath: "imgs"
					}
				}
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
			          presets: ['@babel/preset-env']
			        }
				}
			},
			// {
			// 	test: /\.js$/,
			// 	exclude: /node_modules/,
			// 	use: {
			// 		loader: "eslint-loader"
			// 	}
			// }
		]
	},
};