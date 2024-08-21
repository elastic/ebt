/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { Subject, distinct, debounceTime, map, filter, Subscription } from 'rxjs';
import get from 'lodash.get';
import has from 'lodash.has';
import type { AnalyticsClientInitContext, EventContext, Event, IShipper } from '../../../client';
import type { FullStoryApi } from './types';
import type { FullStorySnippetConfig } from './load_snippet';
import { getPropertiesAndSchema } from './get_properties_and_schema';
import { loadSnippet } from './load_snippet';
import { getParsedVersion } from './get_parsed_version';

const PAGE_VARS_KEYS = [
  // Page-specific keys
  'pageName',
  'page',
  'entityId',
  'applicationId',

  // Deployment-specific keys
  'version', // x4, split to version_major, version_minor, version_patch for easier filtering
  'buildSha', // Useful for Serverless
  'cloudId',
  'deploymentId',
  'projectId', // projectId and deploymentId are mutually exclusive. They shouldn't be sent in the same offering.
  'cluster_name',
  'cluster_uuid',
  'cluster_version',
  'license_id',
  'license_status',
  'license_type',

  // Session-specific
  'session_id',
  'preferred_languages',
] as const;

// `labels` object keys from page vars.
const PAGE_VARS_LABELS_KEYS = ['serverless'] as const;

/**
 * FullStory shipper configuration.
 */
export interface FullStoryShipperConfig extends FullStorySnippetConfig {
  /**
   * FullStory's custom events rate limit is very aggressive.
   * If this setting is provided, it'll only send the event types specified in this list.
   */
  eventTypesAllowlist?: string[];
  /**
   * FullStory only allows calling setVars('page') once per navigation.
   * This setting defines how much time to hold from calling the API while additional lazy context is being resolved.
   */
  pageVarsDebounceTimeMs?: number;
}

interface FullStoryUserVars {
  userId?: string;
  isElasticCloudUser?: boolean;
  cloudIsElasticStaffOwned?: boolean;
  cloudTrialEndDate?: string;
}

interface FullStoryPageContext extends Pick<EventContext, (typeof PAGE_VARS_KEYS)[number]> {
  labels: {
    [Key in (typeof PAGE_VARS_LABELS_KEYS)[number]]: unknown;
  };
}

/**
 * FullStory shipper.
 */
export class FullStoryShipper implements IShipper {
  /** Shipper's unique name */
  public static shipperName = 'FullStory';

  private readonly fullStoryApi: FullStoryApi;
  private lastUserId: string | undefined;
  private readonly eventTypesAllowlist?: string[];
  private readonly pageContext$ = new Subject<EventContext>();
  private readonly userContext$ = new Subject<FullStoryUserVars>();
  private readonly subscriptions = new Subscription();

  /**
   * Creates a new instance of the FullStoryShipper.
   * @param config {@link FullStoryShipperConfig}
   * @param initContext {@link AnalyticsClientInitContext}
   */
  constructor(
    config: FullStoryShipperConfig,
    private readonly initContext: AnalyticsClientInitContext
  ) {
    const { eventTypesAllowlist, pageVarsDebounceTimeMs = 500, ...snippetConfig } = config;
    this.fullStoryApi = loadSnippet(snippetConfig);
    this.eventTypesAllowlist = eventTypesAllowlist;

    this.subscriptions.add(
      this.userContext$
        .pipe(
          distinct(({ userId, isElasticCloudUser, cloudIsElasticStaffOwned, cloudTrialEndDate }) =>
            [userId, isElasticCloudUser, cloudIsElasticStaffOwned, cloudTrialEndDate].join('-')
          )
        )
        .subscribe((userVars) => this.updateUserVars(userVars))
    );

    this.subscriptions.add(
      this.pageContext$
        .pipe(
          map((newContext) => {
            // Cherry-picking fields because FS limits the number of fields that can be sent.
            // > Note: You can capture up to 20 unique page properties (exclusive of pageName) for any given page
            // > and up to 500 unique page properties across all pages.
            // https://help.fullstory.com/hc/en-us/articles/1500004101581-FS-setVars-API-Sending-custom-page-data-to-FullStory
            const pageVars = PAGE_VARS_KEYS.reduce(
              (acc, key) => {
                if (has(newContext, key)) {
                  acc[key] = get(newContext, key) as any;
                }
                return acc;
              },
              {} as Record<string, unknown>
            );

            const pageLabelsVars = PAGE_VARS_LABELS_KEYS.reduce(
              (acc, key) => {
                const labelKey = `labels.${key}`;
                if (has(newContext, labelKey)) {
                  acc.labels = acc.labels || {};
                  acc.labels[key] = get(newContext, labelKey);
                }
                return acc;
              },
              {} as Pick<FullStoryPageContext, 'labels'>
            );

            return {
              ...pageVars,
              ...pageLabelsVars,
            } as Partial<FullStoryPageContext> & Record<string, unknown>;
          }),
          filter((pageVars) => Object.keys(pageVars).length > 0),
          // Wait for anything to actually change.
          distinct((pageVars) => {
            const sortedKeys = Object.keys(pageVars).sort();
            return sortedKeys.map((key) => pageVars[key]).join('-');
          }),
          // We need some debounce time to ensure everything is updated before calling FS because some properties cannot be changed twice for the same URL.
          debounceTime(pageVarsDebounceTimeMs)
        )
        .subscribe((pageVars) => {
          this.initContext.logger.debug(() => `Calling FS.setProperties/page with context ${JSON.stringify(pageVars)}`);
          const { properties, schema } = getPropertiesAndSchema({
            ...pageVars,
            ...(pageVars.version ? getParsedVersion(pageVars.version) : {}),
          });
          this.fullStoryApi('setProperties', {
            type: 'page',
            properties,
            schema,
          });
        })
    );
  }

  /**
   * Calls `fs.identify`, `fs.setUserVars` and `fs.setVars` depending on the fields provided in the newContext.
   * @param newContext The full new context to set {@link EventContext}
   */
  public extendContext(newContext: EventContext): void {
    this.initContext.logger.debug(() => `Received context ${JSON.stringify(newContext)}`);

    // FullStory requires different APIs for different type of contexts:
    // User-level context.
    this.userContext$.next(newContext);
    // Event-level context. At the moment, only the scope `page` is supported by FullStory for webapps.
    this.pageContext$.next(newContext);
  }

  /**
   * Stops/restarts the shipping mechanism based on the value of isOptedIn
   * @param isOptedIn `true` for resume sending events. `false` to stop.
   */
  public optIn(isOptedIn: boolean): void {
    this.initContext.logger.debug(`Setting FS to optIn ${isOptedIn}`);
    // FullStory uses 2 different opt-in methods:
    // - `consent` is needed to allow collecting information about the components
    //   declared as "Record with user consent" (https://help.fullstory.com/hc/en-us/articles/360020623574).
    //   We need to explicitly call `consent` if for the "Record with user content" feature to work.
    this.fullStoryApi('setIdentity', { consent: isOptedIn });
    // - `restart` and `shutdown` fully start/stop the collection of data.
    if (isOptedIn) {
      this.fullStoryApi('restart');
    } else {
      this.fullStoryApi('shutdown');
    }
  }

  /**
   * Filters the events by the eventTypesAllowlist from the config.
   * Then it transforms the event into a FS valid format and calls `fs.event`.
   * @param events batched events {@link Event}
   */
  public reportEvents(events: Event[]): void {
    this.initContext.logger.debug(`Reporting ${events.length} events to FS`);
    events
      .filter((event) => this.eventTypesAllowlist?.includes(event.event_type) ?? true)
      .forEach((event) => {
        // We only read event.properties and discard the rest because the context is already sent in the other APIs.
        const { properties, schema } = getPropertiesAndSchema(event.properties);
        this.fullStoryApi('trackEvent', {
          name: event.event_type,
          properties,
          schema,
        });
      });
  }

  /**
   * Flushes all internal queues of the shipper.
   * It doesn't really do anything inside because this shipper doesn't hold any internal queues.
   */
  public async flush() {}

  /**
   * Shuts down the shipper.
   */
  public shutdown() {
    this.subscriptions.unsubscribe();
  }

  private updateUserVars({
    userId,
    isElasticCloudUser,
    cloudIsElasticStaffOwned,
    cloudTrialEndDate,
  }: FullStoryUserVars) {
    // Call it only when the userId changes
    if (userId && userId !== this.lastUserId) {
      this.initContext.logger.debug(`Calling FS.identify with userId ${userId}`);
      // We need to call the API for every new userId (restarting the session).
      this.fullStoryApi('setIdentity', { uid: userId });
      this.lastUserId = userId;
    }

    // User-level context
    if (typeof isElasticCloudUser === 'boolean' || typeof cloudIsElasticStaffOwned === 'boolean' || cloudTrialEndDate) {
      const userVars = {
        isElasticCloudUser,
        cloudIsElasticStaffOwned,
        cloudTrialEndDate,
      };
      this.initContext.logger.debug(() => `Calling FS.setProperties/user with ${JSON.stringify(userVars)}`);
      const { properties, schema } = getPropertiesAndSchema(userVars);
      this.fullStoryApi('setProperties', {
        type: 'user',
        properties,
        schema,
      });
    }
  }
}
