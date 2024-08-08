/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { FSApi } from '@fullstory/snippet';

/**
 * Definition of the FullStory API.
 * Docs are available at https://developer.fullstory.com/.
 */
export type FullStoryApi = FSApi;

declare global {
  interface Window {
    _fs_debug: boolean;
    _fs_host: string;
    _fs_org: string;
    _fs_namespace: string;
    _fs_script: string;
    FS: FullStoryApi;
  }
}
