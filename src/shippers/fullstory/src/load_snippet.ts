/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { FullStoryApi } from './types';

/**
 * FullStory basic configuration.
 */
export interface FullStorySnippetConfig {
  /**
   * The FullStory account id.
   */
  fullStoryOrgId: string;
  /**
   * The host to send the data to. Used to overcome AdBlockers by using custom DNSs.
   * If not specified, it defaults to `fullstory.com`.
   */
  host?: string;
  /**
   * The URL to load the FullStory client from. Falls back to `edge.fullstory.com/s/fs.js` if not specified.
   */
  scriptUrl?: string;
  /**
   * Whether the debug logs should be printed to the console.
   */
  debug?: boolean;
  /**
   * The name of the variable where the API is stored: `window[namespace]`. Defaults to `FS`.
   */
  namespace?: string;
  /**
   * Set to `false` to hold FS from capturing as soon as the snippet is loaded.
   * https://developer.fullstory.com/browser/auto-capture/capture-data/#manually-delay-data-capture
   */
  captureOnStartup?: boolean;
}

export function loadSnippet({
  scriptUrl = 'https://edge.fullstory.com/s/fs.js',
  fullStoryOrgId,
  host = 'fullstory.com',
  namespace = 'FS',
  debug = false,
  captureOnStartup,
}: FullStorySnippetConfig): FullStoryApi {
  window._fs_debug = debug;
  window._fs_host = host;
  window._fs_script = scriptUrl;
  window._fs_org = fullStoryOrgId;
  window._fs_namespace = namespace;

  // Only set it if the option is provided, since documentation doesn't show it as a "normal" thing to set up.
  if (typeof captureOnStartup === 'boolean') {
    window._fs_capture_on_startup = captureOnStartup;
  }

  require('./raw_snippet'); // load and execute the snippet. Moved to a separate file so that we can disable type-checks.

  const fullStoryApi = window[namespace as 'FS'];

  if (!fullStoryApi) {
    throw new Error('FullStory snippet failed to load. Check browser logs for more information.');
  }

  return fullStoryApi;
}
