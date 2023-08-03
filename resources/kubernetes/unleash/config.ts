import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('unleash');

export const host = config.require('host');
export const image = config.require('image');
