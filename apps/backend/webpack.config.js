const { NxAppWebpackPlugin } = require("@nx/webpack/app-plugin");
const { join } = require("path");
const { DefinePlugin } = require("webpack");
const { getBuildDate, getPackageVersion } = require("../../tools/build-metadata.cjs");
const version = getPackageVersion();

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "source-map",
  output: {
    path: join(__dirname, "../../dist/apps/backend"),
  },
  watchOptions: {
    ignored: [
      "**/*.spec.ts",
      "**/*.test.ts",
      "**/__tests__/**",
      "**/__mocks__/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
    ],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: "node",
      compiler: "tsc",
      main: "./src/main.ts",
      tsConfig: "./tsconfig.app.json",
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: "none",
      generatePackageJson: true,
    }),
    new DefinePlugin({
      __APP_VERSION__: JSON.stringify(version),
      "process.env.__APP_VERSION__": JSON.stringify(version),
      __BUILD_DATE__: JSON.stringify(getBuildDate()),
    }),
  ],
};
