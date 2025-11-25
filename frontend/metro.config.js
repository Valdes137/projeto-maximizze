const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adiciona suporte para arquivos .wasm (que o SQLite usa) e .db
config.resolver.assetExts.push('wasm', 'db');

module.exports = config;