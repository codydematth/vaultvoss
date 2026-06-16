const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withJitpack(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('https://www.jitpack.io')) {
      config.modResults.contents = config.modResults.contents.replace(
        /https:\/\/www\.jitpack\.io/g,
        'https://jitpack.io'
      );
    }
    return config;
  });
};
