import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('abax-vwfs');

export const standardDeployment = new StandardDeployment(
  'abax-vwfs',
  {
    image: config.require('ui-image'),
    tag: config.require('tag'),
    host: config.require('host'),
    secretEnv: {
      VWFS_CLIENT_ID: config.require('vwfs-client-id'),
      VWFS_CLIENT_SECRET: config.requireSecret('vwfs-client-secret'),
      VWFS_AUTH_URL: config.require('vwfs-auth-url'),
      VWFS_API_URL: config.require('vwfs-api-url'),
      ABAX_CLIENT_ID: config.requireSecret('abax-client-id'),
      ABAX_CLIENT_SECRET: config.requireSecret('abax-client-secret'),
    },
  },
  { providers: [provider] },
);
