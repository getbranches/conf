import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config('todoist-github-bot-event-handler');
export const host = config.requireSecret('host');
export const tag = config.require('tag');

