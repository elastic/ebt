/**
 * @jest-environment jsdom
 */

import { Observable, Subject } from 'rxjs';
import { analyticsClientMock } from '../../client/src/mocks';
import { registerGlobalSessionContextProvider } from './global_session_context_provider';

jest.doMock('moment', () => {
  const moment = jest.requireActual('moment');
  return () => moment('2022-01-01');
});

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
      { global_session: '3eeebecf40f7a6b0abdeb20bc665c7076c64a752d233c5b5216db5b667f47fdb' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: '3eeebecf40f7a6b0abdeb20bc665c7076c64a752d233c5b5216db5b667f47fdb' },
      { global_session: '1c4ef81ee026fa06aaab5f75c6e00d5b9a9457d69a56991e5a9f35e73753853d' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '3eeebecf40f7a6b0abdeb20bc665c7076c64a752d233c5b5216db5b667f47fdb' },
      { global_session: '1c4ef81ee026fa06aaab5f75c6e00d5b9a9457d69a56991e5a9f35e73753853d' },
      { global_session: '3eeebecf40f7a6b0abdeb20bc665c7076c64a752d233c5b5216db5b667f47fdb' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: '3eeebecf40f7a6b0abdeb20bc665c7076c64a752d233c5b5216db5b667f47fdb' },
      { global_session: '1c4ef81ee026fa06aaab5f75c6e00d5b9a9457d69a56991e5a9f35e73753853d' },
      { global_session: '3eeebecf40f7a6b0abdeb20bc665c7076c64a752d233c5b5216db5b667f47fdb' },
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
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
      { global_session: '407da607662092d2d2af767ca9d47f4f59d09add0da1c9994aaf66741adb7d25' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
      { global_session: '407da607662092d2d2af767ca9d47f4f59d09add0da1c9994aaf66741adb7d25' },
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
      { global_session: '407da607662092d2d2af767ca9d47f4f59d09add0da1c9994aaf66741adb7d25' },
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
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
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
    ]);
  });

  test('does not emit twice if the session stored in sessionStorage matches the calculated one from the userId', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();

    sessionStorage.setItem('ebt_global_session', 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf');

    registerGlobalSessionContextProvider({ analyticsClient, userId$, organizationId: 'org1' });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    expect(returnedContexts).toEqual([
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
    ]);

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: 'a863486481150581c0d6162764153126bc815b102af065076860ef8c5e45bddf' },
    ]);
  });
});
