import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { tripletexConsumerToken, tripletexEmployeeToken } from './config';

export const reportsTripletexSecret = new k8s.core.v1.Secret(
  'reports-tripletex-secrets',
  {
    metadata: {
      name: 'reports-tripletex-secrets',
    },
    stringData: {
      TRIPLETEX_CONSUMER_TOKEN: tripletexConsumerToken,
      TRIPLETEX_EMPLOYEE_TOKEN: tripletexEmployeeToken,
    },
  },
  { provider },
);
