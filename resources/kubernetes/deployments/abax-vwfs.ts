import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('abax-vwfs');

export const standardDeployment = new StandardDeployment(
  'abax-vwfs',
  {
    image: config.require('portal-image'),
    tag: config.require('tag'),
    host: config.require('host'),
    secretEnv: {
      DB_HOST: config.require('db-host'),
      DB_PASSWORD: config.requireSecret('db-password'),
      DB_USER: config.requireSecret('db-user'),
      DB_PORT: config.require('db-port'),
      DB_DATABASE: config.require('db-database'),
      ABAX_CLIENT_ID: config.requireSecret('abax-client-id'),
      ABAX_CLIENT_SECRET: config.requireSecret('abax-client-secret'),
      VWFS_CLIENT_ID: config.require('vwfs-client-id'),
      VWFS_CLIENT_SECRET: config.requireSecret('vwfs-client-secret'),
      VWFS_AUTH_URL: config.require('vwfs-auth-url'),
      VWFS_API_URL: config.require('vwfs-api-url'),
      SIGN_SECRET: config.requireSecret('sign-secret'),
    },
  },
  { providers: [provider] },
);
