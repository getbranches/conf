import * as aws from '@pulumi/aws';
import { profile, region } from './config';

export const provider = new aws.Provider('aws', {
  region,
  profile,
});
