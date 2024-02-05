import * as google from '@pulumi/google-native';
import { region } from '../../config';
import { mainProvider } from '../../google/project';

// Create a Google Cloud Storage bucket
export const matrixDataBucket = new google.storage.v1.Bucket(
  'matrix-synapse-media-bucket',
  {
    name: 'matrix-synapse-media-bucket',
    location: region,
  },
  { provider: mainProvider },
);

// Create a Google Cloud service account
export const matrixSynapseServiceAccount = new google.iam.v1.ServiceAccount(
  'matrix-synapse-service-account',
  {
    accountId: 'matrix-synapse-service-account',
    name: 'matrix-synapse-service-account',
    displayName: 'Matrix Service Account',
  },
  { provider: mainProvider },
);

// Grant the service account the role of Storage Object Viewer on the bucket
new google.storage.v1.BucketIamBinding(
  'bucket-iam-binding',
  {
    name: matrixDataBucket.name,
    role: 'roles/storage.objectViewer',
    members: [
      matrixSynapseServiceAccount.email.apply(
        email => `serviceAccount:${email}`,
      ),
    ],
  },
  { provider: mainProvider },
);
