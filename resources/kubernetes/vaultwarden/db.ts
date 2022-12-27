import * as k8s from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';
import { provider } from '../provider';

const name = 'vaultwarden';
const team = 'acid';
const username = 'vaultwarden';
export const database = 'vaultwarden';
const crd = 'acid.zalan.do';

const dbCluster = new k8s.apiextensions.CustomResource(
  name,
  {
    kind: 'postgresql',
    apiVersion: `${crd}/v1`,
    metadata: {
      name: `${team}-${name}`,
      labels: {
        team,
      },
    },
    spec: {
      teamId: team,
      postgresql: {
        version: '14',
      },
      numberOfInstances: 1,
      volume: {
        size: '10Gi',
      },
      users: {
        [username]: [],
      },
      databases: {
        [database]: database,
      },
      // enableConnectionPooler: true,
      allowedSourceRanges: null,
      resources: {
        requests: {
          cpu: '50m',
          memory: '100Mi',
        },
        limits: {
          cpu: '100m',
          memory: '150Mi',
        },
      },
    },
  },
  { provider },
);

// Template: {namespace}.{username}.{cluster}.credentials.{tprkind}.{tprgroup}
export const dbSecretName = interpolate`${username}.${dbCluster.metadata.name}.credentials.postgresql.${crd}`;

export const serviceHostname = interpolate`${dbCluster.metadata.name}.${dbCluster.metadata.namespace}.svc.cluster.local`;
