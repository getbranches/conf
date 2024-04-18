import * as gcp from '@pulumi/gcp';
import { interpolate } from '@pulumi/pulumi';
import { callerServiceAccount, clusterDevelopers } from '../config';
import { mainProvider, project } from './project';

// Cluster roles for caller service account
export const callerClusterIamBinding = new gcp.projects.IAMBinding(
  'caller-cluster-access',
  {
    project: project.projectId,
    role: 'roles/container.clusterAdmin',
    members: [interpolate`serviceAccount:${callerServiceAccount}`],
  },
  { provider: mainProvider },
);

new gcp.projects.IAMBinding(`clusterDevelopers-cluster-access`, {
  project: project.projectId,
  role: 'roles/container.developer',
  members: clusterDevelopers,
});
