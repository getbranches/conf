import * as pulumi from '@pulumi/pulumi';
import { StandardDatabase } from '../components/standard-database';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('abax-vwfs');

export const abaxVwfsDb = new StandardDatabase(
  'abax-vwfs',
  {
    username: 'abaxvwfs',
    database: 'abaxvwfs',
  },
  { providers: [provider] },
);

export const standardDeployment = new StandardDeployment(
  'abax-vwfs',
  {
    image: config.require('portal-image'),
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
    databaseDetails: abaxVwfsDb.databaseDetails,
  },
  { providers: [provider] },
);
