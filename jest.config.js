const { TS_TRANSFORM_PATTERN } = require('ts-jest/presets');

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  rootDir: '.',
  roots: ['src'],
};

module.exports = config;
