import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { k8sServiceAccountName } from '../kubernetes/postgres-operator';
import { cluster } from './gke';
import { mainClassicProvider } from './project';

export const bucket = new gcp.storage.Bucket(
  'postgres-backup',
  {
    name: 'branches-db-backups',
    location: 'EU',
    storageClass: 'COLDLINE',
    publicAccessPrevention: 'enforced',
    versioning: {
      enabled: true,
    },
  },
  { provider: mainClassicProvider, protect: true },
);

export const backupServiceAccount = new gcp.serviceaccount.Account(
  'postgres-backup',
  {
    accountId: 'postgres-backup',
    displayName: 'postgres-backup',
  },
  { provider: mainClassicProvider },
);

export const bucketIamRole = new gcp.storage.BucketIAMMember(
  'postgres-backup',
  {
    bucket: bucket.name,
    role: 'roles/storage.objectAdmin',
    member: pulumi.interpolate`serviceAccount:${backupServiceAccount.email}`,
  },
  { provider: mainClassicProvider },
);

export const serviceAccountIamRole = new gcp.serviceaccount.IAMMember(
  'postgres-backup',
  {
    serviceAccountId: backupServiceAccount.name,
    role: 'roles/iam.workloadIdentityUser',
    member: pulumi.interpolate`serviceAccount:${cluster.workloadIdentityConfig.workloadPool}[${k8sServiceAccountName}]`,
  },
  { provider: mainClassicProvider },
);
