import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('abax-procore');

export const standardDeployment = new StandardDeployment(
  'abax-procore',
  {
    image: config.require('image'),
    tag: config.require('tag'),
    host: config.require('host'),
    secretEnv: {
      SANITY_SECRET_TOKEN: config.requireSecret('sanity-token'),
      SANITY_PROJECT_ID: config.requireSecret('sanity-project-id'),
      PROCORE_APP_CLIENT_ID: config.require('procore-app-client-id'),
      PROCORE_APP_CLIENT_SECRET: config.requireSecret(
        'procore-app-client-secret',
      ),
      PROCORE_APP_SANDBOX_CLIENT_ID: config.require(
        'procore-app-sandbox-client-id',
      ),
      PROCORE_APP_SANDBOX_CLIENT_SECRET: config.requireSecret(
        'procore-app-sandbox-client-secret',
      ),
    },
  },
  { providers: [provider] },
);

const defaultContainer =
  standardDeployment.deployment.spec.template.spec.containers[0];

export const cronJob = new k8s.batch.v1.CronJob(
  `abax-procore-cronjob`,
  {
    metadata: {
      name: `abax-procore-cronjob`,
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
                  name: 'abax-procore-cronjob',
                  image: defaultContainer.image,
                  envFrom: defaultContainer.envFrom,
                  env: defaultContainer.env,
                  command: ['node', 'packages/server/dist/sync.js'],
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
