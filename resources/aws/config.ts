import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('aws');

export const region = config.get('region') ?? 'eu-north-1';
export const profile = config.get('profile') ?? 'branches';