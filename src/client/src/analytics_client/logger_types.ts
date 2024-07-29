/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/**
 * @public
 */
export type LogMessageSource = string | (() => string);
import type { EventType } from '../events';

/**
 * Logger exposes all the necessary methods to log any type of information and
 * this is the interface used by the logging consumers including plugins.
 *
 * @public
 */
export interface Logger {
  /**
   * Log messages useful for debugging and interactive investigation
   *
   * @param message - The log message, or a function returning the log message
   * @param meta - The ECS meta to attach to the log entry
   *
   */
  debug(message: LogMessageSource, meta?: Record<EventType, unknown>): void;

  /**
   * Logs messages related to general application flow
   *
   * @param message - The log message, or a function returning the log message
   * @param meta - The ECS meta to attach to the log entry
   *
   */
  info(message: LogMessageSource, meta?: Record<EventType, unknown>): void;

  /**
   * Logs abnormal or unexpected errors or messages
   *
   * @param errorOrMessage - An Error object, message string, or function returning the log message
   * @param meta - The ECS meta to attach to the log entry
   *
   */
  warn(errorOrMessage: LogMessageSource | Error, meta?: Record<EventType, unknown>): void;

  /**
   * Logs abnormal or unexpected errors or messages that caused a failure in the application flow
   *
   * @param errorOrMessage - An Error object, message string, or function returning the log message
   * @param meta - The ECS meta to attach to the log entry
   *
   */
  error(
    errorOrMessage: LogMessageSource | Error,
    meta?: Record<EventType, unknown>
  ): void;

  /**
   * Returns a new {@link Logger} instance extending the current logger context.
   *
   * @example
   * ```typescript
   * const logger = loggerFactory.get('plugin', 'service'); // 'plugin.service' context
   * const subLogger = logger.get('feature'); // 'plugin.service.feature' context
   * ```
   */
  get(...childContextPaths: string[]): Logger;
}
