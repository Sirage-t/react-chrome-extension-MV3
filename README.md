# React Chrome Extension MV3 Starter

A boilerplate code to get you started with building chrome extensions (manifest v3) using modern web technologies, namely `react` and `typescript`.

The tool uses webpack v5 and webpack dev server v4.

---

## Content

1. [Install](#install)
2. [Dev Server](#dev-server)
3. [Build](#build)
   - [Dev Build](#dev-build)
   - [Watch Build](#watch-build)
   - [Prod Build](#prod-build)
4. [Usage](#usage)
   - [Custom Pages](#custom-pages)
   - [Scripts](#scripts)
5. [Manifest](#manifest)
6. [Service Worker](#service-worker)
7. [Advance Config](#advance-config)
   - [Webpack](#webpack)
   - [Eslint](#eslint)
8. [LICENSE](#license)

## Install

Clone the repo or download a zipped file and then unzip.

Then,

```javascript
// if you prefer npm
npm install

// if you prefer yarn
yarn install
```

## Dev Server

To use `webpack-dev-server` with hot module reloading enabled by default, run:

```javascript
// npm
npm start

// or yarn
yarn start
```

Use the **Dev Server** when designing your extension and **Build** when you want to test it in Chrome.

**Note**: you need to build if you want to use/test Chrome API.

## Build

You can build the project in three ways depending on your need.

### Dev Build

Build the extension in development mode, with sourcemaps and un-minified code.

```javascript
// if you prefer npm
npm run dev

// if you prefer yarn
yarn run dev
```

### Watch Build

Build in development mode with `watch` enabled. This will watch for any changes and automatically rebuild so you don't have to run `dev` every single time you make a change.

```javascript
// npm
npm run watch

// yarn
yarn run watch
```

### Prod Build

Build for production, minified, no comments, and no sourcemaps (reduces file size and is not actually needed when publishing for production).

```javascript
// npm
npm run build

// yarn
yarn run build
```

## Usage

The main goal when the tool was created was to be as flexible as possible and cover as many use cases out of the box, with minimal to no additional configuration (no need to touch webpack config file). To this end, you create custom react pages (see [Custom Pages](#custom-pages)), and scripts (standalone typescript files — see [Scripts](#scripts)) that will automatically be build for you when detected.

### Custom Pages

In addition to the default pages: `popup`, `options`, `newtab`, and `options`, you can create your own custom html page powered by react.

1. Create a new folder inside `src/UIElements` (the name is used for the final html file)
2. Inside the new folder create an `index.html`, `index.tsx`, and `App.tsx` (you can copy these from `popup` or any other folder)
3. The content of these files is similar to `create-react-app` if you have used that before.

Note: both `index.html` and `index.tsx` are required and the name must be exact. You can `App.tsx` whatever you want as long as you import it correctly in `index.tsx`.

When you build, a new html file will be created in the `build` folder, with the name of the original folder as its name (eg if the `index.html` is inside a folder named 'signin' you final file will be `signin.html`).

Any js or css files will be automatically added to your final html file.

### Scripts

If you want to create a standalone javascript file, like a content script, you can do so by:

1. Creating a new folder inside `src/scripts`
2. Creating an `index.ts` file inside the folder

The emitted js will be in `js/[folder name].js`.\
Inside of `index.ts` you can use ES modules as well.

Note: `index.ts` is required. It is the entry file for webpack.

## Manifest

Make sure to leave only what you need in `manifest.json`. Other properties must be deleted to avoid errors and compromising your extension.

Please refer to this [page](https://developer.chrome.com/docs/extensions/mv3/manifest/) for a summary of what properties are required/supported.

Note: the `name`, `version` and `description` properties will be automatically added to the `manifest.json` from the `package.json` during build process. Only update them from `package.json`.

## Service Worker

The service worker is in its own folder as it needs to be emitted directly in the `build` folder (can't be in a nested folder). If moved to `build/js` the extension will raise an error when loaded onto Chrome.

Only one service worker is allowed in manifest v3, but you can use ES modules. Make sure to import them in `serviceworker/index.ts`, webpack will take care of the rest.

---

## Advance Config

### Webpack

You can config webpack.config.js however you want.

### Eslint

The tool uses `Airbnb` style, if you don't like it feel free to change it in `.eslintrc.json`.

## LICENSE
