import * as k8s from '@pulumi/kubernetes';
import { output } from '@pulumi/pulumi';
import { provider } from '../provider';
import { host, image, tag } from './config';
import { procoreAbaxSecrets } from './secrets';

const name = 'procore-abax';

export const port = 8000;

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
              name,
              image: `${image}:${tag}`,
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort: port }],
              envFrom: [
                { secretRef: { name: procoreAbaxSecrets.metadata.name } },
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
                {
                  name: 'NODE_ENV',
                  value: 'production',
                },
              ],
              resources: {
                requests: {
                  cpu: '100m',
                  memory: '512Mi',
                },
                limits: {
                  cpu: '100m',
                  memory: '512Mi',
                },
              },
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

// set up a kubernetes engine cron job that runs every night at 4 AM
export const cronJob = new k8s.batch.v1.CronJob(
  `${name}-cronjob`,
  {
    metadata: {
      name: `${name}-cronjob`,
    },
    spec: {
      schedule: '0 4 * * *', // every night at 4 AM
      jobTemplate: {
        spec: {
          template: {
            spec: {
              restartPolicy: 'OnFailure',
              containers: [
                {
                  name,
                  image: `${image}:${tag}`,
                  envFrom: [
                    { secretRef: { name: procoreAbaxSecrets.metadata.name } },
                  ],
                  command: ['node', 'dist/sync.js'],
                },
              ],
            },
          },
        },
      },
    },
  },
  { provider },
);
