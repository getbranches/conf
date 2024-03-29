import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('todoist-github');
export const host = config.require('host');
export const tag = config.require('tag');
export const webhookSecret = config.requireSecret('webhook-secret');
export const logLevel = config.get('log-level') ?? 'info';
