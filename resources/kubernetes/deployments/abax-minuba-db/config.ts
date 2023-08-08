import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('abax-minuba-db');

export const host = config.require('host');
export const image = config.require('ext-image');
