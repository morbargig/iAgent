const { readFileSync } = require('fs');
const { resolve } = require('path');

const rootPackagePath = resolve(__dirname, '../package.json');

const readRootPackage = () => {
  return JSON.parse(readFileSync(rootPackagePath, 'utf8'));
};

const getPackageVersion = () => {
  if (process.env.APP_VERSION?.trim()) {
    return process.env.APP_VERSION.trim();
  }

  return readRootPackage().version;
};

const getBuildDate = () => {
  if (process.env.BUILD_DATE?.trim()) {
    return process.env.BUILD_DATE.trim();
  }

  return new Date().toISOString();
};

module.exports = {
  getPackageVersion,
  getBuildDate,
};
