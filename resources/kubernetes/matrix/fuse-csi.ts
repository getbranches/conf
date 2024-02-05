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
      pulumi.interpolate`serviceAccount:${project.projectId}.svc.id.goog[${matrixK8sServiceAccount.metadata.namespace}/${matrixK8sServiceAccount.metadata.name}]`,
    ],
  },
  { provider: mainClassicProvider },
);
