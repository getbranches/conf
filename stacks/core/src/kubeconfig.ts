import * as pulumi from '@pulumi/pulumi';
import { cluster } from './google/gke';
import * as googleConfig from './google/config';

export const kubeconfig = pulumi.
  all([googleConfig.project, cluster.name, cluster.endpoint, cluster.masterAuth]).
  apply(([projectId, name, endpoint, auth]) => {
    const context = pulumi.interpolate`${projectId}_${googleConfig.zone}_${name}`;
    return pulumi.secret(pulumi.interpolate`apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin for use with kubectl by following
        https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke
      provideClusterInfo: true
`);
  });