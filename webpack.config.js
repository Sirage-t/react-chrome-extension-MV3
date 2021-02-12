const path = require('path');
const fs = require('fs');
const { camelCase } = require('lodash');
const { getIfUtils, removeEmpty } = require('webpack-config-utils');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const pkgJson = require('./package.json');

const ifDirIsNotEmpty = (dir, value) => {
  return fs.readdirSync(dir).length !== 0 ? value : undefined;
};

module.exports = (env) => {
  const { ifProd, ifDev } = getIfUtils(env);
  const ifPopupExists = fs.existsSync('./src/popup');
  const ifOptionsExists = fs.existsSync('./src/options');
  const ifDevtoolsExists = fs.existsSync('./src/devtools');

  /** get a list of all folders in UIElements (this means the user has added a (react) html page and wants webpack to handle bundling and transpiling) */
  const UIElementsDir = path.join(__dirname, 'src', 'UIElements');
  const UIElements = fs
    .readdirSync(UIElementsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
  const setUIElementEntries = () => {
    const _entries = {};
    UIElements.forEach((e) => {
      _entries[camelCase(e)] = `./src/UIElements/${e}/index.tsx`;
    });
    return _entries;
  };
  const setUIElementHtml = () => {
    const htmlPages = [];
    UIElements.forEach((e) => {
      htmlPages.push(
        new HtmlWebpackPlugin({
          filename: `${camelCase(e)}.html`,
          template: path.join(UIElementsDir, e, 'index.html'),
          chunks: [camelCase(e)],
        }),
      );
    });
    return htmlPages;
  };

  return {
    mode: ifProd('production', 'development'),
    entry: removeEmpty({
      popup: ifPopupExists && './src/popup/index.tsx',
      options: ifOptionsExists && './src/options/index.tsx',
      devtools: ifDevtoolsExists && './src/devtools/index.tsx',
      ...setUIElementEntries(),
    }),
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: ifProd(
        'js/[name]-[contenthash].bundle.js',
        'js/[name].bundle.js',
      ),
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
              plugins: removeEmpty([ifDev('react-refresh/babel')]),
            },
          },
          exclude: /node_modules/,
          include: [path.resolve(__dirname, 'src')],
        },
        {
          test: /\.(s[ac]|c)ss$/i,
          use: removeEmpty([
            ifProd(MiniCssExtractPlugin.loader, 'style-loader'),
            'css-loader',
            'sass-loader',
          ]),
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'img/[hash][ext][query]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[hash][ext][query]',
          },
        },
      ],
    },
    plugins: removeEmpty([
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false, // don't remove index.html when using the flag watch
      }),
      ifProd(
        new MiniCssExtractPlugin({
          filename: 'css/[name].css',
        }),
      ),
      ifPopupExists &&
        new HtmlWebpackPlugin({
          filename: 'popup.html',
          template: 'src/popup/index.html',
          chunks: ['popup'],
        }),
      ifOptionsExists &&
        new HtmlWebpackPlugin({
          filename: 'options.html',
          template: 'src/options/index.html',
          chunks: ['options'],
        }),
      ifDevtoolsExists &&
        new HtmlWebpackPlugin({
          filename: 'devtools.html',
          template: 'src/devtools/index.html',
          chunks: ['devtools'],
        }),
      ...setUIElementHtml(),
      new CopyPlugin({
        patterns: removeEmpty([
          ifDirIsNotEmpty(path.join(__dirname, 'public', 'icons'), {
            from: 'public/icons',
            to: 'icons',
          }),
          {
            from: 'public/manifest.json',
            transform: (buffer) => {
              const manifestJson = JSON.parse(buffer.toString());
              manifestJson.name = pkgJson.name;
              manifestJson.version = pkgJson.version;
              manifestJson.description = pkgJson.description;
              manifestJson.author = pkgJson.author;
              manifestJson.homepage_url = pkgJson.homepage; // TODO: check this
              return Buffer.from(JSON.stringify(manifestJson));
            },
          },
        ]),
      }),
      ifDev(new ReactRefreshWebpackPlugin()),
    ]),
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
    },
    devtool: ifProd(false, 'eval-source-map'),
    devServer: {
      //   index: 'index.html', // The filename that is considered the index file.
      port: 3003,
      host: 'localhost',
      open: true, // open the browser after server had been started
      compress: true,
      overlay: true, // show compiler errors in the browser
      static: path.join(__dirname, 'public'),
    },
  };
};
