/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export function getParsedVersion(version: string): {
  version: string;
  version_major: number;
  version_minor: number;
  version_patch: number;
} {
  const [major, minor, patch] = version.split('.');
  return {
    version,
    version_major: parseInt(major, 10),
    version_minor: parseInt(minor, 10),
    version_patch: parseInt(patch, 10),
  };
}
