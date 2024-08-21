# @elastic/ebt/shippers/fullstory

FullStory implementation as a shipper for the `@elastic/ebt/client`.

## How to use it

This module is intended to be used **on the browser only**. It does not support server-side events.

```typescript
import { FullStoryShipper } from "@elastic/ebt/shippers/fullstory";

analytics.registerShipper(FullStoryShipper, { fullStoryOrgId: '12345' })
```

## Configuration

|           Name           | Description                                                                                                                                                                                                                                                                                                                                                                                                   | 
|:------------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| 
|     `fullStoryOrgId`     | FullStory account ID                                                                                                                                                                                                                                                                                                                                                                                          |
|          `host`          | The host to send the data to. Used to overcome AdBlockers by using custom DNSs. If not specified, it defaults to `fullstory.com`.                                                                                                                                                                                                                                                                             |
|       `scriptUrl`        | The URL to load the FullStory client from. Falls back to `edge.fullstory.com/s/fs.js` if not specified.                                                                                                                                                                                                                                                                                                       |
|         `debug`          | Whether the debug logs should be printed to the console. Defaults to `false`.                                                                                                                                                                                                                                                                                                                                 |
|       `namespace`        | The name of the variable where the API is stored: `window[namespace]`. Defaults to `FS`.                                                                                                                                                                                                                                                                                                                      |
|    `captureOnStartup`    | Set to `false` to avoid FullStory from start capturing as soon as the snippet is loaded ([docs](https://developer.fullstory.com/browser/auto-capture/capture-data/#manually-delay-data-capture)). Useful if the opt-in status needs to be retrieved via async methods (such as HTTP fetch). Also recommended when jumping through multiple domains (Global UI to deployment-specific domain, and vice-versa). |
|  `eventTypesAllowlist`   | FullStory's custom events rate limit is very aggressive. Use this list to indicate which event types are allowed to be sent to FullStory. By default, it sends all events.                                                                                                                                                                                                                                    |
| `pageVarsDebounceTimeMs` | FullStory only allows calling `FS('setProperties', { type: 'page' })` once per navigation (URL change). This setting defines how much time to hold from calling the API while additional lazy context is being resolved. Defaults to `500`.                                                                                                                                                                   |

## FullStory Custom Events Rate Limits

FullStory limits the number of custom events that can be sent per second ([docs](https://help.fullstory.com/hc/en-us/articles/360020623234#custom-property-rate-limiting)). In order to comply with that limit, this shipper will only emit the event types registered in the allow-list defined in the constant [CUSTOM_EVENT_TYPES_ALLOWLIST](./src/fullstory_shipper.ts). We may change this behaviour in the future to a remotely-controlled list of events or rely on the opt-in _cherry-pick_ config mechanism of the Analytics Client.

## Transmission protocol

This shipper relies on FullStory official snippet. The internals about how it transfers the data are not documented.
