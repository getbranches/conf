import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { webhookSecret } from './config';

export const todoistGitHubSecrets = new k8s.core.v1.Secret(
  'todoist-github-secrets',
  {
    metadata: {
      name: 'todoist-github-secrets',
      annotations: {
        'pulumi.com/skipAwait': 'true',
      },
    },
    stringData: {
      WEBHOOK_SECRET: webhookSecret,
    },
  },
  { provider },
);
