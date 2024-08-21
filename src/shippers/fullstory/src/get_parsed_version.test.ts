/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { getParsedVersion } from './get_parsed_version';

describe('getParsedVersion', () => {
  test('parses a version string', () => {
    expect(getParsedVersion('1.2.3')).toEqual({
      version: '1.2.3',
      version_major: 1,
      version_minor: 2,
      version_patch: 3,
    });
  });

  test('parses a version string with extra label', () => {
    expect(getParsedVersion('1.2.3-SNAPSHOT')).toEqual({
      version: '1.2.3-SNAPSHOT',
      version_major: 1,
      version_minor: 2,
      version_patch: 3,
    });
  });

  test('does not throw for invalid version', () => {
    expect(getParsedVersion('INVALID_VERSION')).toEqual({
      version: 'INVALID_VERSION',
      version_major: NaN,
      version_minor: NaN,
      version_patch: NaN,
    });
  });
});
