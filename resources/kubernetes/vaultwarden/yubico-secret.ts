import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { yubicoClientId, yubicoClientSecret } from './config';

export const vaultwardenYubicoSecret = new k8s.core.v1.Secret(
  'vaultwarden-yubico-secret',
  {
    metadata: {
      name: 'vaultwarden-yubico-secret',
    },
    stringData: {
      YUBICO_CLIENT_ID: yubicoClientId,
      YUBICO_SECRET_KEY: yubicoClientSecret,
    },
  },
  { provider },
);
