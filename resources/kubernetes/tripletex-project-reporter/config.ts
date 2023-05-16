import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('tripletex-project-reporter');

export const host = config.require('host');
export const tag = config.require('tag');
export const image = config.require('image');
