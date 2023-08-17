import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('abax-minuba');

export const standardDeployment = new StandardDeployment(
  'abax-minuba-ui',
  {
    image: config.require('ui-image'),
    tag: config.require('tag'),
    host: config.require('frontend-host'),
    logLevel: 'debug',
    healthCheckHttpPath: '/',
  },
  { providers: [provider] },
);

export const serverDeployment = new StandardDeployment(
  'abax-minuba-server',
  {
    image: config.require('server-image'),
    tag: config.require('tag'),
    host: config.require('api-host'),
    logLevel: 'debug',
    secretEnv: {
      FRONTEND_URL: pulumi
        .output(config.require('frontend-host'))
        .apply(host => `https://${host}`),
      ABAX_CLIENT_ID: config.require('abax-client-id'),
      ABAX_CLIENT_SECRET: config.require('abax-client-secret'),
      DATABASE_CONNECTION_URL: config.require('database-connection-url'),
    },
    ports: [
      {
        port: 8080,
        name: 'public',
      },
      {
        port: 8081,
        name: 'management',
      },
    ],
  },
  { providers: [provider] },
);
