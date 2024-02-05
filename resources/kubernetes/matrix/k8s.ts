import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { matrixSynapseServiceAccount } from './google';

export const matrixK8sServiceAccountNamespace = new k8s.core.v1.Namespace(
  'matrix-service-account-namespace',
  {
    metadata: {
      name: 'service-account',
    },
  },
  { provider },
);

export const matrixK8sServiceAccount = new k8s.core.v1.ServiceAccount(
  'matrix-service-account',
  {
    metadata: {
      name: 'branches',
      namespace: matrixK8sServiceAccountNamespace.metadata.name,
      annotations: {
        'iam.gke.io/gcp-service-account':
          matrixSynapseServiceAccount.email.apply(email => email),
      },
    },
  },
  { provider },
);
