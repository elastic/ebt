/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import moment from 'moment';

// https://help.fullstory.com/hc/en-us/articles/360020623234#reserved-properties
const FULLSTORY_RESERVED_PROPERTIES = [
  'uid',
  'displayName',
  'email',
  'acctId',
  'website',
  // https://developer.fullstory.com/page-variables
  'pageName',
];

export type FSProperties = Record<string, unknown>;
export type FSSchema = { [p: string]: string | FSSchema };

export function getPropertiesAndSchema(context: object): {
  properties: FSProperties;
  schema: { properties: FSSchema };
} {
  // Clean the properties by removing undefined at all levels
  const properties = removeUndefined(context);
  const schema = buildSchema(properties);
  return { properties, schema: { properties: schema } };
}

function removeUndefined(context: object): FSProperties {
  return Object.fromEntries(
    Object.entries(context)
      // Discard any undefined values
      .map<[string, unknown]>(([key, value]) => {
        return Array.isArray(value) ? [key, value.filter((v) => typeof v !== 'undefined')] : [key, value];
      })
      .filter(([, value]) => typeof value !== 'undefined' && (!Array.isArray(value) || value.length > 0))
      .map(([key, value]) => {
        if (isRecord(value)) {
          return [key, removeUndefined(value)];
        }
        return [key, value];
      })
  );
}

/**
 * Build the schema as per FullStory requirements https://developer.fullstory.com/browser/custom-properties/
 * @param context
 */
export function buildSchema(context: object): FSSchema {
  return Object.fromEntries(
    Object.entries(context)
      // Discard any undefined values
      .map<[string, unknown]>(([key, value]) => {
        return Array.isArray(value) ? [key, value.filter((v) => typeof v !== 'undefined')] : [key, value];
      })
      // Discard reserved properties (no need to define them in the schema)
      .filter(([key]) => !FULLSTORY_RESERVED_PROPERTIES.includes(key))
      .filter(([, value]) => typeof value !== 'undefined' && (!Array.isArray(value) || value.length > 0))
      // Infer the type according to the FullStory specs
      .map(([key, value]) => {
        if (isRecord(value)) {
          return [key, buildSchema(value)];
        }
        const valueType = getFullStoryType(value);
        return [key, valueType];
      })
      .filter(([, value]) => typeof value !== 'undefined')
  );
}

function getFullStoryType(value: unknown) {
  // For arrays, make the decision based on the first element
  const isArray = Array.isArray(value);
  const v = isArray ? value[0] : value;
  let type: string;
  switch (typeof v) {
    case 'string':
      type = moment(v, moment.ISO_8601, true).isValid() ? 'date' : 'str';
      break;
    case 'number':
      type = Number.isInteger(v) ? 'int' : 'real';
      break;
    case 'boolean':
      type = 'bool';
      break;
    case 'object':
      if (isDate(v)) {
        type = 'date';
        break;
      }
    default:
      throw new Error(`Unsupported type: ${typeof v}`);
  }

  // convert to plural form for arrays
  return isArray ? `${type}s` : type;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !isDate(value);
}

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}
