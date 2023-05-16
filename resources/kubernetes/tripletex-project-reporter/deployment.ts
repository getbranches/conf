import * as k8s from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';
import { provider } from '../provider';
import { host, image, tag } from './config';

const name = 'tripletex-project-reporter';

export const port = 4242;

const deployment = new k8s.apps.v1.Deployment(
  `${name}-deployment`,
  {
    metadata: { name },
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
              image: `${image}:${tag}`,
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort: port }],
              env: [
                {
                  name: 'PORT',
                  value: String(port),
                },
              ],
            },
          ],
        },
      },
    },
  },
  { provider },
);

export const service = new k8s.core.v1.Service(
  `${name}-service`,
  {
    metadata: { name },
    spec: {
      ports: [{ port }],
      selector: deployment.spec.selector.matchLabels,
    },
  },
  { provider },
);
