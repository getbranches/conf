import * as gcp from '@pulumi/gcp';
import * as google from '@pulumi/google-native';
import * as pulumi from '@pulumi/pulumi';
import { interpolate } from '@pulumi/pulumi';

const config = new pulumi.Config('google');

const nullProvider = new gcp.Provider('google-null-provider', {});

export const project = new gcp.organizations.Project(
  'main-project',
  {
    projectId: 'branches-org-main',
    billingAccount: config.require('billing-account-id'),
    folderId: config.require('folder-id'),
  },
  { provider: nullProvider, deleteBeforeReplace: true },
);

export const mainClassicProvider = new gcp.Provider('google-main-provider', {
  project: project.projectId,
});

export const mainProvider = new google.Provider('google-native-main-provider', {
  project: project.projectId,
});

new google.cloudresourcemanager.v3.ProjectIamMember(
  'main-project-iam-member',
  {
    member: interpolate`serviceAccount:${config.require('service-account')}`,
    role: 'roles/owner',
    name: project.projectId,
  },
  { provider: mainProvider },
);
