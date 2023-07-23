import * as k8s from '@pulumi/kubernetes';
import { systemEmail } from './config';
import { provider } from './provider';

const namespace = new k8s.core.v1.Namespace(
  'caddy-system',
  {
    metadata: {
      name: 'caddy-system',
    },
  },
  { provider },
);

export const ingress = new k8s.helm.v3.Chart(
  'caddy-ingress',
  {
    chart: 'caddy-ingress-controller',
    version: '1.0.5',
    fetchOpts: {
      repo: 'https://caddyserver.github.io/ingress/',
    },
    skipAwait: true,
    namespace: namespace.metadata.name,
    values: {
      ingressController: {
        config: {
          email: systemEmail,
        },
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
