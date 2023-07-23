import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { adminToken } from './config';

export const vaultwardenAdminTokenSecret = new k8s.core.v1.Secret(
  'vaultwarden-admin-token',
  {
    metadata: {
      name: 'vault-admin-token',
    },
    stringData: {
      ADMIN_TOKEN: adminToken,
    },
  },
  { provider },
);
