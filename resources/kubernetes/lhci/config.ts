import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('lhci');
export const host = config.require('host');
