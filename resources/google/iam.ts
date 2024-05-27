import * as gcp from '@pulumi/gcp';
import { interpolate } from '@pulumi/pulumi';
import { callerServiceAccount, clusterDevelopers } from '../config';
import { mainClassicProvider, project } from './project';

// Cluster roles for caller service account
export const callerClusterIamBinding = new gcp.projects.IAMBinding(
  'caller-cluster-access',
  {
    project: project.projectId,
    role: 'roles/container.clusterAdmin',
    members: [interpolate`serviceAccount:${callerServiceAccount}`],
  },
  { provider: mainClassicProvider },
);

clusterDevelopers.map(
  member =>
    new gcp.projects.IAMMember(
      `cluster-developers-cluster-access`,
      {
        project: project.projectId,
        role: 'roles/container.developer',
        member,
      },
      { provider: mainClassicProvider },
    ),
);
