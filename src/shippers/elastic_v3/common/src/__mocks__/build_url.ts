import { BuildShipperHeaders, BuildShipperUrl, BuildShipperUrlOptions } from "../types";

export const buildShipperUrl: BuildShipperUrl = (urlOptions: BuildShipperUrlOptions): string => {
  const { channelName } = urlOptions;
  const baseUrl = 'https://telemetry-staging.elastic.co';
  return `${baseUrl}/v3/send/${channelName}`;
}


export const buildShipperHeaders: BuildShipperHeaders = (clusterUuid: string, version: string, licenseId?: string) => {
  return {
    'content-type': 'application/x-ndjson',
    'x-elastic-cluster-id': clusterUuid,
    'x-elastic-stack-version': version,
    ...(licenseId && { 'x-elastic-license-id': licenseId }),
  };
}
