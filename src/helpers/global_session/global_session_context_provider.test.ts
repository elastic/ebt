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
      { global_session: '405d558f20aa062cb46827448abca04b748bb2323c2303c1c230433053f6375b' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: '405d558f20aa062cb46827448abca04b748bb2323c2303c1c230433053f6375b' },
      { global_session: '186305014a8aa57d9b49ce303b0c3b9a0d1f35280db39062d61daf7668315a24' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '405d558f20aa062cb46827448abca04b748bb2323c2303c1c230433053f6375b' },
      { global_session: '186305014a8aa57d9b49ce303b0c3b9a0d1f35280db39062d61daf7668315a24' },
      { global_session: '405d558f20aa062cb46827448abca04b748bb2323c2303c1c230433053f6375b' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: '405d558f20aa062cb46827448abca04b748bb2323c2303c1c230433053f6375b' },
      { global_session: '186305014a8aa57d9b49ce303b0c3b9a0d1f35280db39062d61daf7668315a24' },
      { global_session: '405d558f20aa062cb46827448abca04b748bb2323c2303c1c230433053f6375b' },
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
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
      { global_session: '1357dd81e493cc3cf1a0975c7d48cb8a89ae3ea7b82178d225ed4a06eccea886' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
      { global_session: '1357dd81e493cc3cf1a0975c7d48cb8a89ae3ea7b82178d225ed4a06eccea886' },
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
      { global_session: '1357dd81e493cc3cf1a0975c7d48cb8a89ae3ea7b82178d225ed4a06eccea886' },
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
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
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
    ]);
  });

  test('does not emit twice if the session stored in sessionStorage matches the calculated one from the userId', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();

    sessionStorage.setItem('ebt_global_session', '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86');

    registerGlobalSessionContextProvider({ analyticsClient, userId$, organizationId: 'org1' });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    expect(returnedContexts).toEqual([
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
    ]);

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '01e12d9a2f810a6b3f2a367bfbe0e1faefc92b08e26419966752b37681ce9e86' },
    ]);
  });
});
