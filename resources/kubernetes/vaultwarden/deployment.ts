import * as k8s from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';
import { provider } from '../provider';
import { vaultwardenAdminTokenSecret } from './admin-token-secret';
import { vaultwardenYubicoSecret } from './yubico-secret';
import { host, image, tag } from './config';
import { database, dbSecretName, serviceHostname } from './db';

const name = 'vaultwarden';

export const port = 80;

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
              envFrom: [
                {
                  prefix: 'POSTGRES_',
                  secretRef: { name: dbSecretName },
                },
                {
                  secretRef: {
                    name: vaultwardenAdminTokenSecret.metadata.name,
                  },
                },
                {
                  secretRef: {
                    name: vaultwardenYubicoSecret.metadata.name,
                  },
                },
              ],
              env: [
                {
                  name: 'DATABASE_URL',
                  value: interpolate`postgres://$(POSTGRES_username):$(POSTGRES_password)@${serviceHostname}:5432/${database}?sslmode=require`,
                },
                {
                  name: 'PORT',
                  value: String(port),
                },
                {
                  name: 'SIGNUPS_ALLOWED',
                  value: 'false',
                },
                {
                  name: 'DOMAIN',
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
