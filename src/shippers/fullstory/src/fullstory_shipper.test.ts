/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { loggerMock } from '../../../client/src/analytics_client/__mocks__/logger';
import { fullStoryApiMock } from './fullstory_shipper.test.mocks';
import { FullStoryShipper } from './fullstory_shipper';

describe('FullStoryShipper', () => {
  let fullstoryShipper: FullStoryShipper;

  beforeEach(() => {
    jest.resetAllMocks();
    fullstoryShipper = new FullStoryShipper(
      {
        debug: true,
        fullStoryOrgId: 'test-org-id',
      },
      {
        logger: loggerMock.create(),
        isDev: true,
      }
    );
  });

  afterEach(() => {
    fullstoryShipper.shutdown();
  });

  describe('extendContext', () => {
    describe("FS('setIdentity')", () => {
      test('calls `setIdentity` when the userId is provided', () => {
        const userId = 'test-user-id';
        fullstoryShipper.extendContext({ userId });
        expect(fullStoryApiMock).toHaveBeenCalledWith('setIdentity', {
          uid: userId,
        });
      });

      test('calls `setIdentity` again only if the userId changes', () => {
        const userId = 'test-user-id';
        fullstoryShipper.extendContext({ userId });
        expect(fullStoryApiMock).toHaveBeenCalledTimes(1);
        expect(fullStoryApiMock).toHaveBeenCalledWith('setIdentity', {
          uid: userId,
        });

        fullstoryShipper.extendContext({ userId });
        expect(fullStoryApiMock).toHaveBeenCalledTimes(1); // still only called once

        fullstoryShipper.extendContext({ userId: `${userId}-1` });
        expect(fullStoryApiMock).toHaveBeenCalledTimes(2); // called again because the user changed
        expect(fullStoryApiMock).toHaveBeenCalledWith('setIdentity', {
          uid: `${userId}-1`,
        });
      });
    });

    describe("FS('setProperties', { type: 'user' })", () => {
      test('calls `setProperties/user` when isElasticCloudUser: true is provided', () => {
        fullstoryShipper.extendContext({ isElasticCloudUser: true });
        expect(fullStoryApiMock).toHaveBeenCalledWith('setProperties', {
          type: 'user',
          properties: {
            isElasticCloudUser: true,
          },
          schema: {
            properties: {
              isElasticCloudUser: 'bool',
            },
          },
        });
      });

      test('calls `setProperties/user` when isElasticCloudUser: false is provided', () => {
        fullstoryShipper.extendContext({ isElasticCloudUser: false });
        expect(fullStoryApiMock).toHaveBeenCalledWith('setProperties', {
          type: 'user',
          properties: {
            isElasticCloudUser: false,
          },
          schema: {
            properties: {
              isElasticCloudUser: 'bool',
            },
          },
        });
      });
    });

    describe("FS('setProperties', { type: 'page' })", () => {
      test('calls `setProperties/page` when version is provided', () => {
        fullstoryShipper.extendContext({ version: '1.2.3' });
        expect(fullStoryApiMock).toHaveBeenCalledWith('setProperties', {
          type: 'page',
          properties: {
            version: '1.2.3',
            version_major: 1,
            version_minor: 2,
            version_patch: 3,
          },
          schema: {
            properties: {
              version: 'str',
              version_major: 'int',
              version_minor: 'int',
              version_patch: 'int',
            },
          },
        });
      });

      test('calls `setProperties/page` when cloudId is provided', () => {
        fullstoryShipper.extendContext({ cloudId: 'test-es-org-id' });
        expect(fullStoryApiMock).toHaveBeenCalledWith('setProperties', {
          type: 'page',
          properties: {
            cloudId: 'test-es-org-id',
          },
          schema: {
            properties: {
              cloudId: 'str',
            },
          },
        });
      });

      test('merges both: version and cloudId if both are provided', () => {
        fullstoryShipper.extendContext({
          version: '1.2.3',
          cloudId: 'test-es-org-id',
        });
        expect(fullStoryApiMock).toHaveBeenCalledWith('setProperties', {
          type: 'page',
          properties: {
            version: '1.2.3',
            version_major: 1,
            version_minor: 2,
            version_patch: 3,
            cloudId: 'test-es-org-id',
          },
          schema: {
            properties: {
              cloudId: 'str',
              version: 'str',
              version_major: 'int',
              version_minor: 'int',
              version_patch: 'int',
            },
          },
        });
      });

      test('adds the rest of the context to `setProperties/page` (only if they match one of the valid keys)', () => {
        const context = {
          userId: 'test-user-id',
          version: '1.2.3',
          cloudId: 'test-es-org-id',
          labels: { serverless: 'test' },
          foo: 'bar',
        };
        fullstoryShipper.extendContext(context);
        expect(fullStoryApiMock).toHaveBeenCalledWith('setProperties', {
          type: 'page',
          properties: {
            version: '1.2.3',
            version_major: 1,
            version_minor: 2,
            version_patch: 3,
            cloudId: 'test-es-org-id',
            labels: { serverless: 'test' },
          },
          schema: {
            properties: {
              version: 'str',
              version_major: 'int',
              version_minor: 'int',
              version_patch: 'int',
              cloudId: 'str',
              labels: { serverless: 'str' },
            },
          },
        });
      });

      test('emits once only if nothing changes', () => {
        const context = {
          userId: 'test-user-id',
          version: '1.2.3',
          cloudId: 'test-es-org-id',
          labels: { serverless: 'test' },
          foo: 'bar',
        };
        fullstoryShipper.extendContext(context);
        fullstoryShipper.extendContext(context);
        expect(fullStoryApiMock).toHaveBeenCalledTimes(2); // 2: userId => setIdentity + rest => setProperties
        fullstoryShipper.extendContext(context);
        expect(fullStoryApiMock).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('optIn', () => {
    test('should call consent true and restart when isOptIn: true', () => {
      fullstoryShipper.optIn(true);
      expect(fullStoryApiMock).toHaveBeenCalledWith('setIdentity', {
        consent: true,
      });
      expect(fullStoryApiMock).toHaveBeenCalledWith('restart');
    });

    test('should call consent false and shutdown when isOptIn: false', () => {
      fullstoryShipper.optIn(false);
      expect(fullStoryApiMock).toHaveBeenCalledWith('setIdentity', {
        consent: false,
      });
      expect(fullStoryApiMock).toHaveBeenCalledWith('shutdown');
    });
  });

  describe('reportEvents', () => {
    test('calls the API once per event in the array with the properties transformed', () => {
      fullstoryShipper.reportEvents([
        {
          event_type: 'test-event-1',
          timestamp: '2020-01-01T00:00:00.000Z',
          properties: { test: 'test-1' },
          context: { pageName: 'test-page-1' },
        },
        {
          event_type: 'test-event-2',
          timestamp: '2020-01-01T00:00:00.000Z',
          properties: { other_property: 'test-2' },
          context: { pageName: 'test-page-1' },
        },
      ]);

      expect(fullStoryApiMock).toHaveBeenCalledTimes(2);
      expect(fullStoryApiMock).toHaveBeenCalledWith('trackEvent', {
        name: 'test-event-1',
        properties: {
          test: 'test-1',
        },
        schema: {
          properties: {
            test: 'str',
          },
        },
      });
      expect(fullStoryApiMock).toHaveBeenCalledWith('trackEvent', {
        name: 'test-event-2',
        properties: {
          other_property: 'test-2',
        },
        schema: {
          properties: {
            other_property: 'str',
          },
        },
      });
    });

    test('filters the events by the allow-list', () => {
      fullstoryShipper = new FullStoryShipper(
        {
          eventTypesAllowlist: ['valid-event-1', 'valid-event-2'],
          debug: true,
          fullStoryOrgId: 'test-org-id',
        },
        {
          logger: loggerMock.create(),
          isDev: true,
        }
      );
      fullstoryShipper.reportEvents([
        {
          event_type: 'test-event-1', // Should be filtered out.
          timestamp: '2020-01-01T00:00:00.000Z',
          properties: { test: 'test-1' },
          context: { pageName: 'test-page-1' },
        },
        {
          event_type: 'valid-event-1',
          timestamp: '2020-01-01T00:00:00.000Z',
          properties: { test: 'test-1' },
          context: { pageName: 'test-page-1' },
        },
        {
          event_type: 'valid-event-2',
          timestamp: '2020-01-01T00:00:00.000Z',
          properties: { test: 'test-2' },
          context: { pageName: 'test-page-1' },
        },
      ]);

      expect(fullStoryApiMock).toHaveBeenCalledTimes(2);
      expect(fullStoryApiMock).toHaveBeenCalledWith('trackEvent', {
        name: 'valid-event-1',
        properties: {
          test: 'test-1',
        },
        schema: {
          properties: {
            test: 'str',
          },
        },
      });
      expect(fullStoryApiMock).toHaveBeenCalledWith('trackEvent', {
        name: 'valid-event-2',
        properties: {
          test: 'test-2',
        },
        schema: {
          properties: {
            test: 'str',
          },
        },
      });
    });
  });
});
