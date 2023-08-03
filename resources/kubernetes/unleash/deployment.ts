import * as k8s from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';
import { provider } from '../provider';
import { host, image } from './config';
import { database, dbSecretName, serviceHostname } from './db';

const name = 'unleash';

export const port = 4242;

const deployment = new k8s.apps.v1.Deployment(
  `${name}-deployment`,
  {
    metadata: {
      name,
      annotations: {
        'pulumi.com/patchForce': 'true',
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
              image,
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort: port }],
              envFrom: [
                {
                  prefix: 'POSTGRES_',
                  secretRef: { name: dbSecretName },
                },
              ],
              env: [
                {
                  name: 'DATABASE_URL',
                  value: interpolate`postgres://$(POSTGRES_username):$(POSTGRES_password)@${serviceHostname}:5432/${database}?sslmode=require`,
                },
                {
                  name: 'HTTP_PORT',
                  value: String(port),
                },
                {
                  name: 'UNLEASH_URL',
                  value: interpolate`https://${host}`,
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
