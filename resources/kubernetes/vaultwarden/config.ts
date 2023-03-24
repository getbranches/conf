import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('vaultwarden');

export const host = config.require('host');
export const tag = config.require('tag');
export const image = config.require('image');
export const adminToken = config.requireSecret('admin-token');
export const yubicoClientId = config.requireSecret('yubico-client-id');
export const yubicoClientSecret = config.requireSecret('yubico-client-secret');
