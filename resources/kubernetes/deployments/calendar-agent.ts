import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('calendar-agent');

export const standardDeployment = new StandardDeployment(
  'calendar-agent',
  {
    image: config.require('image'),
    tag: config.require('tag'),
    host: config.require('host'),
    secretEnv: {
      GOOGLE_CLIENT_ID: config.require('google-client-id'),
      GOOGLE_CLIENT_SECRET: config.requireSecret('google-client-secret'),
      GOOGLE_PROJECT: config.require('google-project'),
    },
  },
  { providers: [provider] },
);
