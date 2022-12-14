import * as pulumi from '@pulumi/pulumi';

const googleConfig = new pulumi.Config('google');

export const folderId = googleConfig.require('folder-id');
export const region = googleConfig.require('region');
export const zone = googleConfig.require('zone');
export const billingAccountId = googleConfig.require('billing-account-id');
export const callerServiceAccount = googleConfig.require('service-account');

const githubConfig = new pulumi.Config('github');
export const githubToken = githubConfig.requireSecret('token');

const expiresAt = new Date(githubConfig.require('token-expires-at'));

if (new Date() > expiresAt) {
  throw new Error('Github token has expired');
}

const config = new pulumi.Config('kubernetes');

export const clusterDevelopers = config.requireObject<string[]>('cluster-developers');