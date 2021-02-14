# React Chrome Extension MV3 Starter

A boilerplate code to get you started with building chrome extensions (manifest v3) using modern web technologies, namely `react` and `typescript`. The tool uses webpack v5 (already configured) and webpack dev server v4 beta.

## Manifest.json

The `name`, `version` and `description` properties will be automatically added to the `manifest.json` from `package.json` during the build process.

## Serviceworker

The `serviceworker.js` file is emitted directly to the `build` folder and not `build/js`, as required by google docs. If moved to `build/js` the extension will raise an error when loaded onto Chrome.
Only one serviceworker is allowed in manifest v3, but since webpack is built to bundle modules you can separate your code into different files and import them in `serviceworker/index.ts`. Webpack will take care of the rest.
