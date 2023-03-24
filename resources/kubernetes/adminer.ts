import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

const name = 'adminer';

export const port = 8080;

new k8s.apps.v1.Deployment(
  `${name}-deployment`,
  {
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: name,
        },
      },
      template: {
        metadata: {
          labels: {
            app: name,
          },
        },
        spec: {
          containers: [
            {
              name: name,
              image: 'adminer:latest',
              ports: [{ containerPort: port }],
            },
          ],
        },
      },
    },
  },
  { provider },
);
