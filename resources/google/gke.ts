import * as google from '@pulumi/google-native';
import { region } from '../config';
import { mainProvider } from './project';

export const cluster = new google.container.v1.Cluster(
  'core-cluster',
  {
    name: 'branches-main',
    releaseChannel: { channel: 'REGULAR' },
    location: region,
    autopilot: { enabled: true },
    addonsConfig: {
      gcsFuseCsiDriverConfig: { enabled: true },
    },
  },
  { provider: mainProvider, protect: true },
);
