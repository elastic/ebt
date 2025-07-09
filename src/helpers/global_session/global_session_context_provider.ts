import { merge, map, type Subject, of, filter, tap, distinctUntilChanged } from 'rxjs';
import { sha256 } from 'js-sha256';
import moment from 'moment';
import type { AnalyticsClient } from '../../client';

export interface GlobalSessionContextProviderOpts {
  analyticsClient: Pick<AnalyticsClient, 'registerContextProvider'>;
  userId$: Subject<string>;
}

const SESSION_STORAGE_KEY = 'ebt_global_session';

export function registerGlobalSessionContextProvider({ analyticsClient, userId$ }: GlobalSessionContextProviderOpts) {
  analyticsClient.registerContextProvider({
    name: 'global_session',
    schema: {
      global_session: {
        type: 'keyword',
        _meta: {
          description: 'Global session ID',
        },
      },
    },
    context$: merge(userId$, of(sessionStorage.getItem(SESSION_STORAGE_KEY))).pipe(
      filter((userId): userId is string => !!userId),
      map((userId) => {
        const startOfTheDay = moment().startOf('day').format('YYYY-MM-DD');

        return sha256(`${userId}:${startOfTheDay}`);
      }),
      tap((sessionId) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }),
      distinctUntilChanged(),
      map((sessionId) => ({ global_session: sessionId }))
    ),
  });
}
