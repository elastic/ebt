/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import * as RxJS from 'rxjs';
import type { FullStoryApi } from './types';

export const fullStoryApiMock: jest.Mocked<FullStoryApi> = jest.fn() as unknown as jest.Mocked<FullStoryApi>;
fullStoryApiMock.identify = jest.fn();
fullStoryApiMock.setUserVars = jest.fn();
fullStoryApiMock.setVars = jest.fn();
fullStoryApiMock.consent = jest.fn();
fullStoryApiMock.restart = jest.fn();
fullStoryApiMock.shutdown = jest.fn();
fullStoryApiMock.event = jest.fn();

jest.doMock('./load_snippet', () => {
  return {
    loadSnippet: () => fullStoryApiMock,
  };
});

jest.doMock('rxjs', () => {
  return {
    ...RxJS,
    debounceTime: () => RxJS.identity,
  };
});
