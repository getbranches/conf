import * as google from '@pulumi/google-native';
import { region } from '../config';
import { mainProvider } from './main-project';

export const cluster = new google.container.v1.Cluster(
  'core-cluster',
  {
    name: 'branches-main',
    releaseChannel: { channel: 'REGULAR' },
    location: region,
    autopilot: { enabled: true },
  },
  { provider: mainProvider },
);
