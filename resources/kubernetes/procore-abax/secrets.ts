import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import {
  procoreClientId,
  procoreClientSecret,
  procoreSandboxClientId,
  procoreSandboxClientSecret,
  sanityProjectId,
  sanityToken,
} from './config';

export const procoreAbaxSecrets = new k8s.core.v1.Secret(
  'procore-abax-secrets',
  {
    metadata: {
      name: 'procore-abax-secrets',
    },
    stringData: {
      SANITY_SECRET_TOKEN: sanityToken,
      SANITY_PROJECT_ID: sanityProjectId,
      PROCORE_APP_CLIENT_ID: procoreClientId,
      PROCORE_APP_CLIENT_SECRET: procoreClientSecret,
      PROCORE_APP_SANDBOX_CLIENT_ID: procoreSandboxClientId,
      PROCORE_APP_SANDBOX_CLIENT_SECRET: procoreSandboxClientSecret,
    },
  },
  { provider },
);
