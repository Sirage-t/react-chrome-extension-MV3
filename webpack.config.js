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

/**
 * @param SrcPath the folder/file name (eg 'popup') or the path relative to the 'src' dir (eg 'scripts/background.ts')
 * @param value the value to return if the folder is found
 */
const ifDirExists = (SrcPath, value) => {
  return fs.existsSync(path.join(__dirname, 'src', SrcPath))
    ? value
    : undefined;
};

module.exports = (env) => {
  const { ifProd, ifDev } = getIfUtils(env);

  const getFolders = (dirPath) => {
    return fs
      .readdirSync(path.join(__dirname, 'src', dirPath), {
        withFileTypes: true,
      })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  };

  /**
   * @param dirPath the path relative to src (eg 'scripts' not 'src/scripts')
   * @param entryFile the entry point (eg 'index.ts' or 'index.tsx')
   */
  const getEntries = (dirPath, entryFile = 'index.tsx') => {
    const _e = {};
    // get all folders
    const folders = getFolders(dirPath);

    folders.forEach((folderName) => {
      _e[camelCase(folderName)] = path.join(
        __dirname,
        'src',
        dirPath,
        folderName,
        entryFile,
      );
    });

    return _e;
  };

  /** get a list of all folders in UIElements (this means the user has added a (react) html page and wants webpack to handle bundling and transpiling) */
  const UIElementsDir = path.join(__dirname, 'src', 'UIElements');
  const setUIElementHtml = () => {
    const htmlPages = [];
    const UIElements = getFolders('UIElements');
    UIElements.forEach((folderName) => {
      htmlPages.push(
        new HtmlWebpackPlugin({
          filename: `${camelCase(folderName)}.html`,
          template: path.join(UIElementsDir, folderName, 'index.html'),
          chunks: [camelCase(folderName)],
        }),
      );
    });
    return htmlPages;
  };

  return {
    mode: ifProd('production', 'development'),
    entry: removeEmpty({
      popup: ifDirExists('popup', path.join(__dirname, 'src/popup/index.tsx')),
      options: ifDirExists('options', './src/options/index.tsx'),
      devtools: ifDirExists('devtools', './src/devtools/index.tsx'),
      onboarding: ifDirExists('onboarding', './src/onboarding/index.tsx'),
      newtab: ifDirExists('newtab', './src/newtab/index.tsx'),
      serviceworker: ifDirExists('serviceworker/index.ts', {
        import: './src/serviceworker/index.ts',
        filename: 'serviceworker.js',
      }),
      ...getEntries('UIElements'),
      ...getEntries('scripts', 'index.ts'),
    }),
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'js/[name].js',
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
      ifDirExists(
        'popup',
        new HtmlWebpackPlugin({
          filename: 'popup.html',
          template: 'src/popup/index.html',
          chunks: ['popup'],
        }),
      ),
      ifDirExists(
        'options',
        new HtmlWebpackPlugin({
          filename: 'options.html',
          template: 'src/options/index.html',
          chunks: ['options'],
        }),
      ),
      ifDirExists(
        'devtools',
        new HtmlWebpackPlugin({
          filename: 'devtools.html',
          template: 'src/devtools/index.html',
          chunks: ['devtools'],
        }),
      ),
      ifDirExists(
        'newtab',
        new HtmlWebpackPlugin({
          filename: 'newtab.html',
          template: 'src/newtab/index.html',
          chunks: ['newtab'],
        }),
      ),
      ifDirExists(
        'onboarding',
        new HtmlWebpackPlugin({
          filename: 'onboarding.html',
          template: 'src/onboarding/index.html',
          chunks: ['onboarding'],
        }),
      ),
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
    devtool: ifProd(false, 'source-map'),
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
