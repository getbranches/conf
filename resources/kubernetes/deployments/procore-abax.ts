import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('procore-abax');

export const standardDeployment = new StandardDeployment(
  'procore-abax',
  {
    image: config.require('image'),
    tag: config.require('tag'),
    host: config.require('host'),
    secretEnv: {
      SANITY_PROJECT_ID: config.requireSecret('sanity-project-id'),
      SANITY_TOKEN: config.requireSecret('sanity-token'),
      PROCORE_CLIENT_ID: config.require('procore-app-client-id'),
      PROCORE_CLIENT_SECRET: config.requireSecret('procore-app-client-secret'),
      PROCORE_SANDBOX_CLIENT_ID: config.require(
        'procore-app-sandbox-client-id',
      ),
      PROCORE_SANDBOX_CLIENT_SECRET: config.requireSecret(
        'procore-app-sandbox-client-secret',
      ),
    },
  },
  { provider },
);

const defaultContainer =
  standardDeployment.deployment.spec.template.spec.containers[0];

export const cronJob = new k8s.batch.v1.CronJob(
  `procore-abax-cronjob`,
  {
    metadata: {
      name: `procore-abax-cronjob`,
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
                  name: 'procore-abax-cronjob',
                  image: defaultContainer.image,
                  envFrom: defaultContainer.envFrom,
                  env: defaultContainer.env,
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
