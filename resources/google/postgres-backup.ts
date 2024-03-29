import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { cluster } from './gke';
import { mainClassicProvider } from './project';

export const k8sServiceAccountName = 'postgres-backup';

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
    lifecycleRules: [
      // Delete backups older than 120 days
      {
        action: {
          type: 'Delete',
        },
        condition: {
          age: 120,
        },
      },
    ],
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
    member: pulumi.interpolate`serviceAccount:${cluster.workloadIdentityConfig.workloadPool}[default/${k8sServiceAccountName}]`,
  },
  { provider: mainClassicProvider },
);
