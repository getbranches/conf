import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('vaultwarden');

export const host = config.require('host');
export const tag = config.require('tag');
export const image = config.require('image');
export const adminToken = config.requireSecret('admin-token');
