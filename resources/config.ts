import * as pulumi from '@pulumi/pulumi';
import { getToken } from 'get-pulumi-secret';

const googleConfig = new pulumi.Config('google');

export const folderId = googleConfig.require('folder-id');
export const region = googleConfig.require('region');
export const zone = googleConfig.require('zone');
export const billingAccountId = googleConfig.require('billing-account-id');
export const callerServiceAccount = googleConfig.require('service-account');

export const githubToken = getToken({ name: 'token', namespace: 'github' });

const config = new pulumi.Config('kubernetes');

export const clusterDevelopers =
  config.requireObject<string[]>('cluster-developers');
