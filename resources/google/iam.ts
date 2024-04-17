import * as google from '@pulumi/google-native';
import { interpolate } from '@pulumi/pulumi';
import { callerServiceAccount, clusterDevelopers } from '../config';
import { mainProvider, project } from './project';

// Cluster roles for caller service account
export const callerClusterIamMember =
  new google.cloudresourcemanager.v3.ProjectIamMember(
    'caller-cluster-access',
    {
      member: interpolate`serviceAccount:${callerServiceAccount}`,
      role: 'roles/container.clusterAdmin',
      name: project.projectId,
    },
    {
      provider: mainProvider,
      ignoreChanges: [
        'bindings',
        'member',
        'name',
        'role',
        'resource',
        'version',
      ],
    },
  );

clusterDevelopers.map(
  member =>
    new google.cloudresourcemanager.v3.ProjectIamMember(
      `${member}-cluster-access`,
      {
        member,
        role: 'roles/container.developer',
        name: project.projectId,
      },
      { provider: mainProvider },
    ),
);
