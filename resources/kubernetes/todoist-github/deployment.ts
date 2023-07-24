import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { provider } from '../provider';
import { host, tag } from './config';

const name = 'todoist-github';

export const managementPort = 8484;
export const publicPort = 8080;

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
              image: `ghcr.io/getbranches/todoist-github-bot/server:${tag}`,
              imagePullPolicy: 'IfNotPresent',
              ports: [
                { containerPort: publicPort },
                { containerPort: managementPort },
              ],
              env: [
                {
                  name: 'PORT',
                  value: String(publicPort),
                },
                {
                  name: 'ADMIN_PORT',
                  value: String(managementPort),
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
      ports: [
        { port: publicPort, targetPort: publicPort },
        { port: managementPort, targetPort: managementPort },
      ],
      selector: deployment.spec.selector.matchLabels,
    },
  },
  { provider },
);
