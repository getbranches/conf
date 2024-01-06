import * as gcp from '@pulumi/gcp';
import * as google from '@pulumi/google-native';
import * as pulumi from '@pulumi/pulumi';
import { interpolate } from '@pulumi/pulumi';
import { nullProvider } from '../utils';

const config = new pulumi.Config('google');

export const project = new gcp.organizations.Project(
  'branches-platform-project',
  {
    projectId: 'branches-platform',
    name: 'Branches Platform',
    billingAccount: config.require('billing-account-id'),
    folderId: config.require('folder-id'),
  },
  { provider: nullProvider, deleteBeforeReplace: true },
);

export const platformClassicProvider = new gcp.Provider(
  'google-platform-provider',
  {
    project: project.projectId,
  },
);

export const platformProvider = new google.Provider(
  'google-native-platform-provider',
  {
    project: project.projectId,
  },
);

export const googleProviders = [platformClassicProvider, platformProvider];

new google.cloudresourcemanager.v3.ProjectIamMember(
  'platform-project-iam-member',
  {
    member: interpolate`serviceAccount:${config.require('service-account')}`,
    role: 'roles/owner',
    name: project.projectId,
  },
  { provider: platformProvider },
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
  'cloudprofiler.googleapis.com',
  'sqladmin.googleapis.com',
  'cloudkms.googleapis.com',
  'cloudfunctions.googleapis.com',
  'run.googleapis.com',
  'cloudbuild.googleapis.com',
  'iam.googleapis.com',
  'cloudbilling.googleapis.com',
  'iamcredentials.googleapis.com',
  'artifactregistry.googleapis.com',
  'eventarc.googleapis.com',
];

export const apiServices = services.map(
  service =>
    new gcp.projects.Service(
      `branches-platform-${service}`,
      {
        service,
        disableOnDestroy: false,
        project: project.projectId,
      },
      { provider: platformClassicProvider },
    ),
);
