import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('todoist-github-frontend');
export const host = config.requireSecret('host');
export const tag = config.get('tag');

