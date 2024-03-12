import * as k8s from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';
import { provider } from '../provider';

const name = 'unleash';
const team = 'thebranches';
const username = 'unleash';
export const database = 'unleash';
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
        size: '15Gi',
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
          cpu: '100m',
          memory: '250Mi',
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
