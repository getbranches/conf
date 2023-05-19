import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { sanityProjectId, sanityToken } from './config';

export const procoreAbaxSecrets = new k8s.core.v1.Secret(
  'procore-abax-secrets',
  {
    metadata: {
      name: 'procore-abax-secrets',
    },
    stringData: {
      SANITY_SECRET_TOKEN: sanityToken,
      SANITY_PROJECT_ID: sanityProjectId,
    },
  },
  { provider },
);
