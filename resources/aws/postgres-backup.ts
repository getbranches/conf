import * as aws from '@pulumi/aws';
import { provider } from './provider';

const bucket = new aws.s3.Bucket(
  'branches-logic-backup',
  {
    bucket: 'branches-logic-backup',
    acl: 'private',
    forceDestroy: true,
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    },
  },
  { provider, protect: true },
);

export const bucketName = bucket.id;

const role = new aws.iam.Role(
  'branches-logic-backup-role',
  {
    name: 'branches-logic-backup-role',
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'rds.amazonaws.com',
          },
          Effect: 'Allow',
          
