import * as k8s from '@pulumi/kubernetes';
import {
  backupServiceAccount,
  bucket,
  serviceAccountIamRole,
} from '../google/postgres-backup';
import { provider } from './provider';

export const serviceAccount = new k8s.core.v1.ServiceAccount(
  'postgres-backup',
  {
    metadata: {
      name: 'postgres-backup',
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
    version: '1.10.0',
    fetchOpts: {
      repo: 'https://opensource.zalando.com/postgres-operator/charts/postgres-operator',
    },
    skipAwait: true,
    values: {
      podAnnotations: {
        'pulumi.com/skipAwait': 'true',
      },
      podServiceAccount: {
        name: serviceAccount.metadata.name,
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
      // podServiceAccount: {
      //   name: serviceAccount.metadata.name,
      // },
    },
  },
  { provider },
);


export const k8sServiceAccountName = 'postgres-backup';

// OperatorConfiguration
export const operatorConfiguration = new k8s.apiextensions.CustomResource(
  'operator-configuration',
  {
    apiVersion: 'acid.zalan.do/v1',
    kind: 'OperatorConfiguration',
    metadata: {
      name: 'postgresql-operator-configuration',
    },
    configuration: {
      aws_or_gcp: {
        wal_gs_bucket: bucket.name,
      },
    },
  },
  { provider },
);
