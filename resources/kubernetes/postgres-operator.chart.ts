import * as k8s from '@pulumi/kubernetes';
import {
  backupServiceAccount,
  bucket,
  k8sServiceAccountName,
  serviceAccountIamRole,
} from '../google/postgres-backup';
import { provider } from './provider';

export const serviceAccount = new k8s.core.v1.ServiceAccount(
  'postgres-backup',
  {
    metadata: {
      name: k8sServiceAccountName,
      annotations: {
        'iam.gke.io/gcp-service-account': backupServiceAccount.email,
      },
    },
  },
  { provider, dependsOn: [serviceAccountIamRole] },
);

/**
 * The postgres-operator helm chart
 *
 * @see https://opensource.zalando.com/postgres-operator/docs/
 * @see https://github.com/zalando/postgres-operator
 * @see https://postgres-operator.readthedocs.io/en/1.10.0/
 */
new k8s.helm.v3.Chart(
  'postgres-operator',
  {
    chart: 'postgres-operator',
    // renovate: depName=postgres-operator packageName=postgres-operator registryUrl=https://opensource.zalando.com/postgres-operator/charts/postgres-operator
    version: '1.10.0',
    fetchOpts: {
      repo: 'https://opensource.zalando.com/postgres-operator/charts/postgres-operator',
    },
    skipAwait: true,
    values: {
      enableJsonLogging: true,
      podAnnotations: {
        'pulumi.com/skipAwait': 'true',
      },
      podServiceAccount: {
        name: serviceAccount.metadata.name,
      },
      configAwsOrGcp: {
        wal_gs_bucket: bucket.name,
      },
      resources: {
        requests: {
          cpu: '250m',
          memory: '512Mi',
        },
        limits: {
          cpu: '250m',
          memory: '512Mi',
        },
      },
    },
  },
  { provider },
);
