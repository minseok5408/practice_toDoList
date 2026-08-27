const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const config = getSentryExpoConfig(__dirname);
const extraWatchFolders = process.env.METRO_EXTRA_WATCH_FOLDERS?.split(
  path.delimiter,
)
  .filter(Boolean)
  .map((folder) => path.resolve(folder));

if (extraWatchFolders?.length) {
  config.watchFolders = [...(config.watchFolders ?? []), ...extraWatchFolders];
}

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  ...(config.resolver.nodeModulesPaths ?? []),
];

module.exports = config;
