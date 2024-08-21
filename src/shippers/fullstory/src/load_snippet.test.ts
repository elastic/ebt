/**
 * @jest-environment jsdom
 */

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { loadSnippet } from './load_snippet';

describe('loadSnippet', () => {
  it('should return the FullStory API', () => {
    const fullStoryApi = loadSnippet({ debug: true, fullStoryOrgId: 'foo' });
    expect(fullStoryApi).toBeDefined();
    expect(typeof fullStoryApi).toBe('function'); // V2: the root API is already the method to call.
    // V1 deprecated methods
    expect(fullStoryApi.event).toBeDefined();
    expect(fullStoryApi.consent).toBeDefined();
    expect(fullStoryApi.restart).toBeDefined();
    expect(fullStoryApi.shutdown).toBeDefined();
    expect(fullStoryApi.identify).toBeDefined();
    expect(fullStoryApi.setUserVars).toBeDefined();
    expect(fullStoryApi.setVars).toBeDefined();
  });

  it('captureOnStartup: undefined should not add the window._fs_capture_on_startup', () => {
    loadSnippet({ fullStoryOrgId: 'foo' });
    expect(window._fs_capture_on_startup).toBeUndefined();
  });

  it.each([{ option: true }, { option: false }])(
    'captureOnStartup: $option should set window._fs_capture_on_startup: $option',
    ({ option }) => {
      loadSnippet({ fullStoryOrgId: 'foo', captureOnStartup: option });
      expect(window._fs_capture_on_startup).toBe(option);
    }
  );
});
