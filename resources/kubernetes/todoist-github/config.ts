import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('todoist-github');
export const tag = config.require('tag');
