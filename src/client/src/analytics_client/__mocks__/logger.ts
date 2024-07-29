/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Logger, LogMessageSource } from '../logger_types';

export type MockedLogger = jest.Mocked<Logger> & { context: string[] };

const createLoggerMock = (context: string[] = []) => {
  const mockLog: MockedLogger = {
    context,
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    get: jest.fn(),
  };
  mockLog.get.mockImplementation((...ctx) => ({
    ...mockLog,
    context: Array.isArray(context) ? context.concat(ctx) : [context, ...ctx].filter(Boolean),
  }));

  return mockLog;
};

const clearLoggerMock = (logger: MockedLogger) => {
  logger.debug.mockClear();
  logger.warn.mockClear();
  logger.error.mockClear();
};

const convertMessageSource = (
  value: [message: LogMessageSource, meta?: unknown | undefined]
): [string] | [string, unknown | undefined] => {
  const message = typeof value[0] === 'function' ? value[0]() : value[0];
  const meta = value[1];
  if (meta) {
    return [message, meta];
  } else {
    return [message];
  }
};

const convertMessageSourceOrError = (
  value: [message: LogMessageSource | Error, meta?: unknown | undefined]
): [string | Error] | [string | Error, unknown | undefined] => {
  const message = typeof value[0] === 'function' ? value[0]() : value[0];
  const meta = value[1];
  if (meta) {
    return [message, meta];
  } else {
    return [message];
  }
};

const collectLoggerMock = (logger: MockedLogger) => {
  return {
    debug: logger.debug.mock.calls.map(convertMessageSource),
    error: logger.error.mock.calls.map(convertMessageSourceOrError),
    warn: logger.warn.mock.calls.map(convertMessageSourceOrError),
  };
};

export const loggerMock = {
  create: createLoggerMock,
  clear: clearLoggerMock,
  collect: collectLoggerMock,
};
