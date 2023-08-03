import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('meti');

export const standardDeployment = new StandardDeployment(
  'meti',
  {
    image: config.require('image'),
    tag: config.require('tag'),
    host: config.require('host'),
    logLevel: 'debug',
  },
  { providers: [provider] },
);
