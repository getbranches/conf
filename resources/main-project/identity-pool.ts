import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { mainClassicProvider } from './main-project';

const provider = mainClassicProvider;

const identityPool = new gcp.iam.WorkloadIdentityPool(
  'main-github',
  {
    disabled: false,
    workloadIdentityPoolId: 'main-github',
  },
  { provider },
);

export const identityPoolProvider = new gcp.iam.WorkloadIdentityPoolProvider(
  'main-github',
  {
    workloadIdentityPoolId: identityPool.workloadIdentityPoolId,
    workloadIdentityPoolProviderId: 'main-github',
    oidc: {
      issuerUri: 'https://token.actions.githubusercontent.com',
    },
    attributeMapping: {
      'google.subject': 'assertion.sub',
      'attribute.actor': 'assertion.actor',
      'attribute.repository': 'assertion.repository',
    },
  },
  { provider },
);

export const getIdentityPoolMember = (owner: string, repo: string) =>
  pulumi.interpolate`principalSet://iam.googleapis.com/${identityPool.name}/attribute.repository/${owner}/${repo}`;
