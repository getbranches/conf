import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { zone } from '../config';
import { cluster } from '../main-project/gke';
import { callerClusterIamMember } from '../main-project/iam';
import { project } from '../main-project/main-project';

export const kubeconfig = pulumi
  .all([cluster.name, cluster.endpoint, cluster.masterAuth, project.name])
  .apply(([name, endpoint, masterAuth, projectName]) => {
    const context = `${projectName}_${zone}_${name}`;
    return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${masterAuth.clusterCaCertificate}
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
    auth-provider:
      config:
        cmd-args: config config-helper --format=json
        cmd-path: gcloud
        expiry-key: '{.credential.token_expiry}'
        token-key: '{.credential.access_token}'
      name: gcp
`;
  });

export const provider = new k8s.Provider(
  'k8s-provider',
  {
    kubeconfig,
  },
  { dependsOn: [cluster, callerClusterIamMember] },
);
