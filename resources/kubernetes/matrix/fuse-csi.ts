import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { mainClassicProvider, project } from '../../google/project';
import { matrixSynapseServiceAccount } from './google';
import { matrixK8sServiceAccount } from './k8s';

new gcp.serviceaccount.IAMBinding(
  'iamServiceAccountIamBinding',
  {
    serviceAccountId: matrixSynapseServiceAccount.name,
    role: 'roles/iam.serviceAccountTokenCreator',
    members: [
      // Construct the Kubernetes service account member string
      // It should be in the format "serviceAccount:PROJECT_ID.svc.id.goog[K8S_NAMESPACE/K8S_SA_NAME]"
      // PROJECT_ID should be replaced by your Google Cloud project ID
      // K8S_NAMESPACE should be replaced by your Kubernetes service account namespace
      // K8S_SA_NAME should be replaced by your Kubernetes service account name
      pulumi.interpolate`serviceAccount:${project.projectId}.svc.id.goog[${matrixK8sServiceAccount.metadata.namespace}/${matrixK8sServiceAccount.metadata.name}]`,
    ],
  },
  { provider: mainClassicProvider },
);
