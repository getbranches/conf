import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('procore-abax');

export const host = config.require('host');
export const tag = config.require('tag');
export const image = config.require('image');

export const sanityProjectId = config.requireSecret('sanity-project-id');
export const sanityToken = config.requireSecret('sanity-token');
export const procoreClientId = config.requireSecret('procore-app-client-id');
export const procoreClientSecret = config.requireSecret(
  'procore-app-client-secret',
);
