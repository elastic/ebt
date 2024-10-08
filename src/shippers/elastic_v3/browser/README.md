# @elastic/ebt/shippers/elastic_v3/browser

UI-side implementation of the Elastic V3 shipper for the `@elastic/ebt/client`.

## How to use it

This module is intended to be used **on the browser only**. Due to the nature of the UI events, they are usually more scattered in time, and we can assume a much lower load than the server. For that reason, it doesn't apply the necessary backpressure mechanisms to prevent the server from getting overloaded with too many events neither identifies if the server sits behind a firewall to discard any incoming events. Refer to `@elastic/ebt/shippers/elastic_v3/server` for the server-side implementation.

```typescript
import { ElasticV3BrowserShipper } from "@elastic/ebt/shippers/elastic_v3/browser";

analytics.registerShipper(ElasticV3BrowserShipper, { channelName: 'myChannel', version: '1.0.0' });
```

## Configuration

|     Name      | Description                                                                                | 
|:-------------:|:-------------------------------------------------------------------------------------------| 
| `channelName` | The name of the channel to send the events.                                                |
|   `version`   | The version of the application generating the events.                                      |
|    `debug`    | When `true`, it logs the responses from the remote Telemetry Service. Defaults to `false`. |

## Transmission protocol

This shipper sends the events to the Elastic Internal Telemetry Service. The incoming events are buffered for up to 1 second to attempt to send them in a single request.
