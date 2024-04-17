import * as pulumi from '@pulumi/pulumi';
import { getToken } from 'get-pulumi-secret';

// This is references to a Pulumi ESC
export const githubToken = pulumi.secret(
  getToken({
    name: 'getbranches-token',
    namespace: 'github',
  }),
);

const googleConfig = new pulumi.Config('google');

export const folderId = googleConfig.require('folder-id');
export const region = googleConfig.require('region');
export const zone = googleConfig.require('zone');
export const billingAccountId = googleConfig.require('billing-account-id');
export const callerServiceAccount = googleConfig.require('service-account');

const k8sConfig = new pulumi.Config('kubernetes');

export const clusterDevelopers =
  k8sConfig.requireObject<string[]>('cluster-developers');
