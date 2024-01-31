import * as gcp from '@pulumi/gcp';
import { region } from '../../config';
import { mainClassicProvider } from '../../google/project';

// Create a Google Cloud Storage bucket
export const matrixDataBucket = new gcp.storage.Bucket(
  'matrix-synapse-media-bucket',
  {
    location: region,
  },
  { provider: mainClassicProvider },
);

// Create a Google Cloud service account
export const matrixSynapseServiceAccount = new gcp.serviceaccount.Account(
  'matrix-synapse-service-account',
  {
    accountId: 'matrix-synapse-service-account',
    displayName: 'Matrix Service Account',
  },
  { provider: mainClassicProvider },
);

// Grant the service account the role of Storage Object Viewer on the bucket
new gcp.storage.BucketIAMMember(
  'bucket-iam-member',
  {
    bucket: matrixDataBucket.name, // reference to our created bucket
    role: 'roles/storage.objectUser',
    member: matrixSynapseServiceAccount.email.apply(
      email => `serviceAccount:${email}`,
    ), // dynamically fetch the service account's email
  },
  { provider: mainClassicProvider },
);
