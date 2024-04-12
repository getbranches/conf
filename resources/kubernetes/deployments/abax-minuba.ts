import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { StandardDatabase } from '../components/standard-database';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('abax-minuba');

export const abaxMinubaDb = new StandardDatabase(
  'abax-minuba',
  ['abaxminuba', 'abaxvwfs'],
  {
    username: 'abaxminuba',
    database: 'abaxminuba',
  },
  { providers: [provider] },
);

export const standardDeployment = new StandardDeployment(
  'abax-minuba-ui',
  {
    image: config.require('ui-image'),
    tag: config.require('tag'),
    host: config.require('frontend-host'),
    initContainers: [
      {
        image: config.require('agent-image'),
        tag: config.require('tag'),
        command: ['pnpm', 'run', 'db:migrate:deploy'],
      },
    ],
    secretEnv: {
      ABAX_CLIENT_ID: config.require('abax-client-id'),
      ABAX_CLIENT_SECRET: config.require('abax-client-secret'),
      MINUBA_API_KEY: config.requireSecret('minuba-api-key'),
    },
    logLevel: 'debug',
    healthCheckHttpPath: '/',
    databaseDetails: abaxMinubaDb.databaseDetails,
  },
  { providers: [provider] },
);

const defaultContainer =
  standardDeployment.deployment.spec.template.spec.containers[0];

export const cronJob = new k8s.batch.v1.CronJob(
  'abax-minuba-cronjob',
  {
    metadata: {
      name: 'abax-minuba-cronjob',
      annotations: {
        'pulumi.com/skipAwait': 'true',
      },
    },
    spec: {
      schedule: '*/30 * * * *', // every 30 minutes
      jobTemplate: {
        spec: {
          template: {
            spec: {
              restartPolicy: 'OnFailure',
              containers: [
                {
                  name: 'abax-minuba-cronjob',
                  image: pulumi
                    .all([config.require('agent-image'), config.require('tag')])
                    .apply(imageParts => imageParts.join(':')),
                  envFrom: defaultContainer.envFrom,
                  env: defaultContainer.env,
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
