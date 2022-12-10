import { Config } from '@pulumi/pulumi';

const config = new Config();

export const systemEmail = config.require('system-email');