import * as k8s from '@pulumi/kubernetes';
import { cluster } from '../google/gke';
import { callerClusterIamMember } from '../google/iam';

export const provider = new k8s.Provider(
  'k8s-provider',
  {
    kubeconfig: cluster.getKubeconfig(),
  },
  { dependsOn: [cluster, callerClusterIamMember] },
);
