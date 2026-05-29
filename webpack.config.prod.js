const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const CopyWebpackPlugin = require("copy-webpack-plugin");
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// var JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  mode: "production", // 'production' para el build final
  entry: {
    content: "./src/index.ts", // Punto de entrada para el content script
  },
  output: {
    path: path.resolve(__dirname, "dist"), // Directorio de salida
    filename: "[name].js", // Nombre del archivo de salida
    clean: true,
    library: {
      name: "Ciet",
      type: "umd",
      export: "default",
    },
    globalObject: "this",
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'TEst ciet', // Título del HTML
      template: './src/index.html', // Ruta de tu archivo HTML base (opcional)
    }),
    // new MiniCssExtractPlugin({
    //   filename: "style.css", // Nombre del archivo CSS combinado
    // }),
    // new CopyWebpackPlugin({
    //   patterns: [
    //     { from: "src/config/assets/icons/", to: "./public/icons/" }, // Copia la carpeta 'img' a 'dist/img'
    //     { from: "src/ui/popup/popup.html", to: "./public/popup.html" }, // Copia la carpeta 'img' a 'dist/img'
    //     // { from: "src/assets/monaco.ts", to: "./monaco.js" }, // Copia la carpeta 'img' a 'dist/img'
    //     { from: "./chrome/manifest.json", to: "./manifest.json" }, // Copia la carpeta 'img' a 'dist/img'
    //   ],
    // }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/, // Regla para archivos TypeScript
        use: "ts-loader", // Usar ts-loader para manejar TypeScript
        exclude: /node_modules/, // Excluir node_modules
      },
    ],
  },
  resolve: {
    alias: {
      "@/utils": path.resolve(__dirname, "src/utils/"),
    },
    extensions: [".tsx", ".ts", ".js"], // Extensiones de archivo para resolver
  },
}
