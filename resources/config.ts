import * as pulumi from '@pulumi/pulumi';

const googleConfig = new pulumi.Config('google');

export const folderId = googleConfig.require('folder-id');

const githubConfig = new pulumi.Config('github');
export const githubToken = githubConfig.requireSecret('token');

const expiresAt = new Date(githubConfig.require('token-expires-at'));

if (new Date() > expiresAt) {
    throw new Error('Github token has expired');
}