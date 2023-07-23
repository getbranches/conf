import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';
import * as awsConfig from '../aws/config';

const operator = new k8s.helm.v3.Chart(
  'postgres-operator',
  {
    chart: 'postgres-operator',
    version: '1.8.2',
    fetchOpts: {
      repo: 'https://opensource.zalando.com/postgres-operator/charts/postgres-operator',
    },
    values: {
      image: {
        /**
         * TODO: Remove when issue 2098 is fixed
         * @see https://github.com/zalando/postgres-operator/issues/2098
         */
        tag: 'v1.8.2-43-g3e148ea5',
      },
    },
  },
  { provider },
);

new k8s.helm.v3.Chart(
  'postgres-operator-ui',
  {
    chart: 'postgres-operator-ui',
    version: '1.8.2',
    fetchOpts: {
      repo: 'https://opensource.zalando.com/postgres-operator/charts/postgres-operator-ui',
    },
  },
  { provider },
);

// Operator Configuration

new k8s.core.v1.ConfigMap(
  'postgres-operator-config',
  {
    metadata: {
      name: 'postgres-operator',
    },
    data: {
      aws_region: awsConfig.region,
      kube_iam_role: ''