import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';

export const volumeClaim = new k8s.core.v1.PersistentVolumeClaim(
  'lhci-data-claim',
  {
    metadata: { name: 'lhci-data-claim' },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: '30Gi',
        },
      },
    },
  },
  { provider },
);
