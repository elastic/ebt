import { type Subject } from 'rxjs';
import { AnalyticsClient } from '../../client';
export interface GlobalSessionContextProviderOpts {
    analyticsClient: Pick<AnalyticsClient, 'registerContextProvider'>;
    userId$: Subject<string>;
}
export declare function registerGlobalSessionContextProvider({ analyticsClient, userId$ }: GlobalSessionContextProviderOpts): void;
