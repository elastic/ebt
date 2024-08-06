/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import {
  buildSchema,
  getPropertiesAndSchema,
} from "./get_properties_and_schema";

describe("buildSchema", () => {
  test("identifies string values as `str`", () => {
    const payload = {
      foo: "bar",
      baz: ["qux"],
    };

    expect(buildSchema(payload)).toEqual({
      foo: "str",
      baz: "strs",
    });
  });

  test("identifies integer values as `int`", () => {
    const payload = {
      foo: 1,
      baz: [100000],
    };

    expect(buildSchema(payload)).toEqual({
      foo: "int",
      baz: "ints",
    });
  });

  test("identifies decimal numbers as `real`", () => {
    const payload = {
      foo: 1.5,
      baz: [100000.5],
    };

    expect(buildSchema(payload)).toEqual({
      foo: "real",
      baz: "reals",
    });
  });

  test("identifies booleans as `bool`", () => {
    const payload = {
      foo: true,
      baz: [false],
    };

    expect(buildSchema(payload)).toEqual({
      foo: "bool",
      baz: "bools",
    });
  });

  test("identifies Dates as `date`", () => {
    const payload = {
      foo: new Date(),
      baz: [new Date()],
    };

    expect(buildSchema(payload)).toEqual({
      foo: "date",
      baz: "dates",
    });
  });

  test("supports nested values", () => {
    const payload = {
      nested: {
        foo: "bar",
        baz: ["qux"],
      },
    };

    expect(buildSchema(payload)).toEqual({
      nested: {
        foo: "str",
        baz: "strs",
      },
    });
  });

  test("skips declaring FullStory's reserved keywords", () => {
    const payload = {
      uid: "uid",
      displayName: "displayName",
      email: "email",
      acctId: "acctId",
      website: "website",
      pageName: "pageName",
    };

    expect(buildSchema(payload)).toEqual({});
  });

  test("removes undefined values", () => {
    const payload = {
      foo: undefined,
      baz: [undefined],
    };

    expect(buildSchema(payload)).toEqual({});
  });

  test("throws if null is provided", () => {
    const payload = {
      foo: null,
      baz: [null],
    };

    expect(() => buildSchema(payload)).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported type: object"`,
    );
  });

  describe("String to Date identification", () => {
    test("appends `_date` to ISO string values", () => {
      const payload = {
        foo: new Date().toISOString(),
        baz: [new Date().toISOString()],
      };

      expect(buildSchema(payload)).toEqual({
        foo: "date",
        baz: "dates",
      });
    });

    test("appends `_str` to random string values", () => {
      const payload = {
        foo: "test-1",
        baz: ["test-1"],
      };

      expect(buildSchema(payload)).toEqual({
        foo: "str",
        baz: "strs",
      });
    });
  });
});

describe("getPropertiesAndSchema", () => {
  test("should return a clean list of properties and its related schema", () => {
    const payload = {
      numericKey: 1,
      decimalKey: 1.1,
      stringKey: "hi",
      booleanKey: true,
      dateKey: new Date(2024, 0, 1),
      undefinedKey: undefined,
      nested: {
        numericKey: 1,
        decimalKey: 1.1,
        stringKey: "hi",
        booleanKey: true,
        dateKey: new Date(2024, 0, 1),
        undefinedKey: undefined,
      },
    };

    expect(getPropertiesAndSchema(payload)).toStrictEqual({
      properties: {
        numericKey: 1,
        decimalKey: 1.1,
        stringKey: "hi",
        booleanKey: true,
        dateKey: new Date(2024, 0, 1),
        nested: {
          numericKey: 1,
          decimalKey: 1.1,
          stringKey: "hi",
          booleanKey: true,
          dateKey: new Date(2024, 0, 1),
        },
      },
      schema: {
        properties: {
          numericKey: "int",
          decimalKey: "real",
          stringKey: "str",
          booleanKey: "bool",
          dateKey: "date",
          nested: {
            numericKey: "int",
            decimalKey: "real",
            stringKey: "str",
            booleanKey: "bool",
            dateKey: "date",
          },
        },
      },
    });
  });
});
