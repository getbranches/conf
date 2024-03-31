import * as k8s from '@pulumi/kubernetes';
import { kubeconfig } from '../kubeconfig';

export const provider = new k8s.Provider("k8s", {
  kubeconfig: kubeconfig,
});