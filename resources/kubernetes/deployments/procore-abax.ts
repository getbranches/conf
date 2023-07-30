import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';

const config = new pulumi.Config('procore-abax');

export const sanityProjectId = config.requireSecret('sanity-project-id');
export const sanityToken = config.requireSecret('sanity-token');
export const procoreClientId = config.require('procore-app-client-id');
export const procoreClientSecret = config.requireSecret(
  'procore-app-client-secret',
);
export const procoreSandboxClientId = config.require(
  'procore-app-sandbox-client-id',
);
export const procoreSandboxClientSecret = config.requireSecret(
  'procore-app-sandbox-client-secret',
);

export const standardDeployment = new StandardDeployment('procore-abax', {
  image: config.require('image'),
  tag: config.require('tag'),
  host: config.require('host'),
  secretEnv: {
    SANITY_PROJECT_ID: sanityProjectId,
    SANITY_TOKEN: sanityToken,
    PROCORE_CLIENT_ID: procoreClientId,
    PROCORE_CLIENT_SECRET: procoreClientSecret,
    PROCORE_SANDBOX_CLIENT_ID: procoreSandboxClientId,
    PROCORE_SANDBOX_CLIENT_SECRET: procoreSandboxClientSecret,
  },
});
