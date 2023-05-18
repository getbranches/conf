import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('tripletex-project-reporter');

export const host = config.require('host');
export const tag = config.require('tag');
export const image = config.require('image');

export const tripletexConsumerToken = config.requireSecret('tripletex-consumer-token');
export const tripletexEmployeeToken = config.requireSecret('tripletex-employee-token');