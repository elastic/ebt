# @elastic/ebt/*

This module implements the Analytics client used for Event-Based Telemetry. The intention of the client is to be usable on both: the UI and the Server sides.

## Client

`@elastic/ebt/client` holds the public APIs to report events, enrich the events' context and set up the transport mechanisms. Refer to the [client's docs](./src/client/README.md) for more information.

## Prebuilt shippers

Elastic-approved shippers are available as `@elastic/ebt/shippers/*` packages. Refer to the [shippers' docs](./src/shippers/README.md) for more information.

---

## Release process

When we want to publish a new version to npmjs, the process is quite simple:

1. Bump the version via the command `yarn version major|minor|patch` (use the prefix `pre` for beta versions).
2. The command should have created a branch matching the new version name and pushed it to the repo. Create a new PR to merge that new branch.
3. After the PR is merged, create a new release from [the pushed tag](https://github.com/elastic/ebt/tags).
4. Step 3 should trigger the [Publish GH Action](./.github/workflows/publish.yml) and publish the NPM package.
