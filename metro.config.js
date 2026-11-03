const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList) ? existingBlockList : [existingBlockList].filter(Boolean)),
  /[\\/]\.expo[\\/]jtmp(?:[\\/]|$)/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
