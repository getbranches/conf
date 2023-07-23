import * as k8s from '@pulumi/kubernetes';
import { output } from '@pulumi/pulumi';
import { provider } from '../provider';
import { host, image, tag } from './config';
import { reportsTripletexSecret } from './tripletex-secret';

const name = 'tripletex-project-reporter';

export const port = 4242;

const resources = {
  requests: {
    cpu: '250m',
    memory: '512Mi',
  },
  limits: {
    cpu: '250m',
    memory: '512Mi',
  },
};

const deployment = new k8s.apps.v1.Deployment(
  `${name}-deployment`,
  {
    metadata: {
      name,
      annotations: {
        'pulumi.com/skipAwait': 'true',
      },
    },
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
              envFrom: [
                { secretRef: { name: reportsTripletexSecret.metadata.name } },
              ],
              env: [
                {
                  name: 'PORT',
                  value: String(port),
                },
                {
                  name: 'SELF_URL',
                  value: output(host).apply(h => `https://${h}`),
                },
              ],
              resources,
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
