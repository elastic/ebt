# @elastic/ebt/shippers/elastic_v3/common

This package holds the common code for the Elastic V3 shippers:

- Types defining the Shipper configurations `ElasticV3ShipperOptions`, `BuildShipperHeaders`, `BuildUrlOptions`, and `BuildShipperUrl`.
- `eventsToNdjson` utility converts any array of events to NDJSON format.
- `reportTelemetryCounters` helps with building the TelemetryCounter to emit after processing an event.

It should be considered an internal package and should not be used other than by the shipper implementations: `@elastic/ebt/shippers/elastic_v3/browser` and `@elastic/ebt/shippers/elastic_v3/server`
