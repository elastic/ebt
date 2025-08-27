/**
 * @jest-environment jsdom
 */

jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return () => moment('2022-01-01');
});

import { Observable, Subject } from 'rxjs';
import { analyticsClientMock } from '../../client/src/mocks';
import { registerGlobalSessionContextProvider } from './global_session_context_provider';

describe('GlobalSessionContextProvider', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('should register the context provider', () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();
    registerGlobalSessionContextProvider({ analyticsClient, userId$ });

    expect(analyticsClient.registerContextProvider).toHaveBeenCalledWith({
      name: 'global_session',
      schema: expect.any(Object),
      context$: expect.any(Observable),
    });
  });

  test('values emitted from userId$ should be consistent', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();
    registerGlobalSessionContextProvider({ analyticsClient, userId$ });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '8c2f5219d643c566dc04a842f3abd8699f947beb27e61b653f262efbad440a2c' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: '8c2f5219d643c566dc04a842f3abd8699f947beb27e61b653f262efbad440a2c' },
      { global_session: 'a7113826fe4a15c3110ec8b9fbec94d6452736489208f1ad12db449eca39582b' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '8c2f5219d643c566dc04a842f3abd8699f947beb27e61b653f262efbad440a2c' },
      { global_session: 'a7113826fe4a15c3110ec8b9fbec94d6452736489208f1ad12db449eca39582b' },
      { global_session: '8c2f5219d643c566dc04a842f3abd8699f947beb27e61b653f262efbad440a2c' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: '8c2f5219d643c566dc04a842f3abd8699f947beb27e61b653f262efbad440a2c' },
      { global_session: 'a7113826fe4a15c3110ec8b9fbec94d6452736489208f1ad12db449eca39582b' },
      { global_session: '8c2f5219d643c566dc04a842f3abd8699f947beb27e61b653f262efbad440a2c' },
    ]);
  });

  test('values emitted from userId$ should be consistent (with organizationId)', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();
    registerGlobalSessionContextProvider({ analyticsClient, userId$, organizationId: 'org1' });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
      { global_session: '69de85b592652a6679627112dba221c6d1645a905a2e225f90edf61440c17906' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
      { global_session: '69de85b592652a6679627112dba221c6d1645a905a2e225f90edf61440c17906' },
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
      { global_session: '69de85b592652a6679627112dba221c6d1645a905a2e225f90edf61440c17906' },
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
    ]);
  });

  test('emits the session ID from sessionStorage', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();

    sessionStorage.setItem('ebt_global_session', 'previously_stored_session_id');

    registerGlobalSessionContextProvider({ analyticsClient, userId$, organizationId: 'org1' });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    expect(returnedContexts).toEqual([{ global_session: 'previously_stored_session_id' }]);

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: 'previously_stored_session_id' },
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
    ]);
  });

  test('does not emit twice if the session stored in sessionStorage matches the calculated one from the userId', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();

    sessionStorage.setItem('ebt_global_session', '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d');

    registerGlobalSessionContextProvider({ analyticsClient, userId$, organizationId: 'org1' });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    expect(returnedContexts).toEqual([
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
    ]);

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '62e6bed1a90344f2400e1398f99d33b97df81ba3ef736643225fccef9e10d02d' },
    ]);
  });
});
