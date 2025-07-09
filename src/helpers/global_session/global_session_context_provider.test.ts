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

  test('values emitted from userId$ should be ', async () => {
    const analyticsClient = analyticsClientMock.create();
    const userId$ = new Subject<string>();
    registerGlobalSessionContextProvider({ analyticsClient, userId$ });

    const returnedContexts: unknown[] = [];

    analyticsClient.registerContextProvider.mock.calls[0][0].context$.subscribe((context) => {
      returnedContexts.push(context);
    });

    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '3b6c198ba3e7152c4f30067ba21e4ce28c0cc3207d8cdc8821511fd325af5b7c' },
    ]);
    userId$.next('user2');
    expect(returnedContexts).toEqual([
      { global_session: '3b6c198ba3e7152c4f30067ba21e4ce28c0cc3207d8cdc8821511fd325af5b7c' },
      { global_session: '943868fdb6f47687213fc8a2a6c4f811b86b62991bf93a8c20c7ca5c26179555' },
    ]);
    userId$.next('user1');
    expect(returnedContexts).toEqual([
      { global_session: '3b6c198ba3e7152c4f30067ba21e4ce28c0cc3207d8cdc8821511fd325af5b7c' },
      { global_session: '943868fdb6f47687213fc8a2a6c4f811b86b62991bf93a8c20c7ca5c26179555' },
      { global_session: '3b6c198ba3e7152c4f30067ba21e4ce28c0cc3207d8cdc8821511fd325af5b7c' },
    ]);
    userId$.next('user1'); // shouldn't emit again
    expect(returnedContexts).toEqual([
      { global_session: '3b6c198ba3e7152c4f30067ba21e4ce28c0cc3207d8cdc8821511fd325af5b7c' },
      { global_session: '943868fdb6f47687213fc8a2a6c4f811b86b62991bf93a8c20c7ca5c26179555' },
      { global_session: '3b6c198ba3e7152c4f30067ba21e4ce28c0cc3207d8cdc8821511fd325af5b7c' },
    ]);
  });
});
