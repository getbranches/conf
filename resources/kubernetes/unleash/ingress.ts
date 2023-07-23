import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { host } from './config';
import { port, service } from './deployment';

const name = 'unleash';

export const ingress = new k8s.networking.v1.Ingress(
  `${name}-ingress`,
  {
    metadata: {
      name,
      annotations: {
        'kubernetes.io/ingress.class': 'caddy',
        'pulumi.com/skipAwait': 'true',
      },
    },
    spec: {
      rules: [
        {
          host,
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: service.metadata.name,
                    port: { number: port },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  { provider, deleteBeforeReplace: true },
);
