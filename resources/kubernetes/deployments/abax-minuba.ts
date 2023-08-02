import * as pulumi from '@pulumi/pulumi';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('abax-minuba');

export const standardDeployment = new StandardDeployment(
  'abax-minuba-ui',
  {
    image: config.require('ui-image'),
    tag: config.require('tag'),
    host: config.require('host'),
    logLevel: 'debug',
  },
  { providers: [provider] },
);
