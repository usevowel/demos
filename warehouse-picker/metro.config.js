const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Configure resolver to prefer CommonJS/React Native entrypoints (fixes Valtio import.meta issues)
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'mjs', 'cjs'],
  // Force Metro to prefer CommonJS/React Native-friendly entrypoints
  // This avoids ESM builds that use import.meta (not supported in Hermes)
  unstable_conditionNames: ['require', 'react-native', 'default'],
  
  // Custom resolveRequest to force CJS resolution for Valtio
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'valtio' || moduleName.startsWith('valtio/')) {
      // Force CJS resolution for Valtio
      return context.resolveRequest(context, require.resolve(moduleName), platform)
    }
    // Default resolution for other modules
    return context.resolveRequest(context, moduleName, platform)
  },
}

module.exports = config