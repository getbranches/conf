import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { provider } from '../../provider';
import { tag as commonTag } from '../config';
import { tag as deploymentTag, host } from './config';

const name = 'todoist-github-frontend';

export const port = 4242;

const tag = deploymentTag ?? commonTag;

if (deploymentTag) {
  pulumi.log.warn(
    'Using a different tag for the todoist-github/frontend deployment than the common tag.',
  );
}

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
              image: `ghcr.io/getbranches/todoist-github-bot/frontend:${tag}`,
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort: port }],
              env: [
                {
                  name: 'PORT',
                  value: String(port),
                },
                {
                  name: 'SELF_URL',
                  value: pulumi.output(host).apply(h => `https://${h}`),
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
