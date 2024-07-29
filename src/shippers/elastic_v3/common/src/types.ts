/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/**
 * Options for the Elastic V3 shipper
 */
export interface ElasticV3ShipperOptions {
  /**
   * The name of the channel to stream all the events to.
   */
  channelName: string;
  /**
   * The product's version.
   */
  version: string;
  /**
   * Provide it to override the Analytics client's default configuration.
   */
  sendTo?: 'staging' | 'production';
  /**
   * Should show debug information about the requests it makes to the V3 API.
   */
  debug?: boolean;
  /**
   * Build shipper URL endpoint for sending EBT
   */
  buildShipperUrl: BuildShipperUrl;
  /**
   * Build shipper request headers for sending EBT
   */
  buildShipperHeaders: BuildShipperHeaders;
}

/** Signuate for the build Shipper headers function */
export type BuildShipperHeaders = (clusterUuid: string, version: string, licenseId?: string) => Record<string, string>;

/** The options to build the URL of the V3 API. */
export interface BuildShipperUrlOptions {
  /** Whether to send it to production or staging. */
  sendTo: 'production' | 'staging';
  /** The name of the channel to send the data to. */
  channelName: string;
}

/** Signuate for the build Shipper url function */
export type BuildShipperUrl = (urlOptions: BuildShipperUrlOptions) => string;
