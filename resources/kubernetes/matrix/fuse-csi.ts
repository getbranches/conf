import * as google from '@pulumi/google-native';
import * as pulumi from '@pulumi/pulumi';
import { mainProvider, project } from '../../google/project';
import { matrixSynapseServiceAccount } from './google';
import { matrixK8sServiceAccount } from './k8s';

new google.iam.v1.ServiceAccountIamBinding(
  'iamServiceAccountIamBinding',
  {
    name: matrixSynapseServiceAccount.name,
    role: 'roles/iam.serviceAccountTokenCreator',
    members: [
      pulumi.interpolate`serviceAccount:${project.projectId}.svc.id.goog[${matrixK8sServiceAccount.metadata.namespace}/${matrixK8sServiceAccount.metadata.name}]`,
    ],
  },
  { provider: mainProvider },
);
