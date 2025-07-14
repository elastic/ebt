import { merge, map, type Subject, of, filter, tap, distinctUntilChanged } from 'rxjs';
import { sha256 } from 'js-sha256';
import moment from 'moment';
import type { AnalyticsClient } from '../../client';

export interface GlobalSessionContextProviderOpts {
  /**
   * The analytics client to register the context provider
   */
  analyticsClient: Pick<AnalyticsClient, 'registerContextProvider'>;
  /**
   * Observable of the current user id
   */
  userId$: Subject<string>;
  /**
   * Organization ID
   */
  organizationId?: string;
}

const SESSION_STORAGE_KEY = 'ebt_global_session';

export function registerGlobalSessionContextProvider({
  analyticsClient,
  userId$,
  organizationId,
}: GlobalSessionContextProviderOpts) {
  const sessionId$ = userId$.pipe(
    filter((userId): userId is string => !!userId),
    map((userId) => {
      const startOfTheDay = moment().startOf('day').format('YYYY-MM-DD');

      return sha256(`${organizationId}:${userId}:${startOfTheDay}`);
    })
  );

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
    context$: merge(sessionId$, of(sessionStorage.getItem(SESSION_STORAGE_KEY))).pipe(
      filter((sessionId): sessionId is string => !!sessionId),
      tap((sessionId) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      }),
      distinctUntilChanged(),
      map((sessionId) => ({ global_session: sessionId }))
    ),
  });
}
