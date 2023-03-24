import * as gcp from '@pulumi/gcp';
import * as google from '@pulumi/google-native';
import * as pulumi from '@pulumi/pulumi';
import { interpolate } from '@pulumi/pulumi';
import { nullProvider } from '../utils';

const config = new pulumi.Config('google');

export const project = new gcp.organizations.Project(
  'main-project',
  {
    projectId: 'branches-org-main',
    name: 'Branches Org Main',
    billingAccount: config.require('billing-account-id'),
    folderId: config.require('folder-id'),
  },
  { provider: nullProvider, deleteBeforeReplace: true },
);

export const mainClassicProvider = new gcp.Provider('google-main-provider', {
  project: project.projectId,
  impersonateServiceAccount: config.require('service-account'),
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

export const services = [
  'servicemanagement.googleapis.com',
  'servicecontrol.googleapis.com',
  'container.googleapis.com',
  'compute.googleapis.com',
  'dns.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'logging.googleapis.com',
  'stackdriver.googleapis.com',
  'monitoring.googleapis.com',
  'cloudtrace.googleapis.com',
  'clouderrorreporting.googleapis.com',
  'clouddebugger.googleapis.com',
  'cloudprofiler.googleapis.com',
  'sqladmin.googleapis.com',
  'cloudkms.googleapis.com',
  'cloudfunctions.googleapis.com',
  'run.googleapis.com',
  'cloudbuild.googleapis.com',
  'iam.googleapis.com',
  'cloudbilling.googleapis.com',
  'iamcredentials.googleapis.com',
];

export const apiServices = services.map(
  service =>
    new gcp.projects.Service(
      `branches-core-${service}`,
      {
        service,
        disableOnDestroy: false,
        project: project.projectId,
      },
      { provider: mainClassicProvider },
    ),
);
