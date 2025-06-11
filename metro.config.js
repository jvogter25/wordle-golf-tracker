const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// For web builds, use basic config without NativeWind
module.exports = config;