/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { resolver: { assetExts, sourceExts } } = defaultConfig;

/** @type {import('metro-config').MetroConfig} */
const config = {
  resolver: {
    // просто добавляем pdf к существующим ассетам
    assetExts: [...assetExts, 'pdf'],
    // sourceExts трогать не нужно
    sourceExts,
  },
};

module.exports = mergeConfig(defaultConfig, config);

