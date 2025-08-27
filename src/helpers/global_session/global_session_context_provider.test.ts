/**
 * @jest-environment jsdom
 */

import { Observable, Subject } from 'rxjs';
import { analyticsClientMock } from '../../client/src/mocks';
import { registerGlobalSessionContextProvider } from './global_session_context_provider';

jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return () => moment('2022-01-01T00:00:00.000Z');
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
      { global_session: 'e4d3fa408fc9882d6079ec39d09ebe0080a7ef6e44c68b077d702f04c9ea385b' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: 'e4d3fa408fc9882d6079ec39d09ebe0080a7ef6e44c68b077d702f04c9ea385b' },
      { global_session: '57bfd7638f8f4a4dbec7cad7f7c5c5729a1b1c369b80d12f6d9eff8cf21bf8c4' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: 'e4d3fa408fc9882d6079ec39d09ebe0080a7ef6e44c68b077d702f04c9ea385b' },
      { global_session: '57bfd7638f8f4a4dbec7cad7f7c5c5729a1b1c369b80d12f6d9eff8cf21bf8c4' },
      { global_session: 'e4d3fa408fc9882d6079ec39d09ebe0080a7ef6e44c68b077d702f04c9ea385b' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: 'e4d3fa408fc9882d6079ec39d09ebe0080a7ef6e44c68b077d702f04c9ea385b' },
      { global_session: '57bfd7638f8f4a4dbec7cad7f7c5c5729a1b1c369b80d12f6d9eff8cf21bf8c4' },
      { global_session: 'e4d3fa408fc9882d6079ec39d09ebe0080a7ef6e44c68b077d702f04c9ea385b' },
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
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
      { global_session: '2c08ab456bd3b7d473f431ff9b66940ffb8a3cdd996a0b0513ec61de40723045' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
      { global_session: '2c08ab456bd3b7d473f431ff9b66940ffb8a3cdd996a0b0513ec61de40723045' },
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
      { global_session: '2c08ab456bd3b7d473f431ff9b66940ffb8a3cdd996a0b0513ec61de40723045' },
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
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
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
    ]);
  });

  test('does not emit twice if the session stored in sessionStorage matches the calculated one from the userId', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();

    sessionStorage.setItem('ebt_global_session', '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396');

    registerGlobalSessionContextProvider({ analyticsClient, userId$, organizationId: 'org1' });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    expect(returnedContexts).toEqual([
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
    ]);

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '3de398aba32389db9327d6f2564f1a82e87d8d328264c201b141716e6662d396' },
    ]);
  });
});
