import * as google from '@pulumi/google-native';
import { region, zone } from '../config';
import { mainProvider } from './main-project';

const serverConfig = google.container.v1.getServerConfigOutput(
  {
    location: region,
  },
  { provider: mainProvider },
);

const engineVersion = serverConfig.apply(conf => conf.validMasterVersions[0]);

const nodeConfig: google.types.input.container.v1.NodeConfigArgs = {
  machineType: 'n1-standard-2',
  oauthScopes: [
    'https://www.googleapis.com/auth/compute',
    'https://www.googleapis.com/auth/devstorage.read_only',
    'https://www.googleapis.com/auth/logging.write',
    'https://www.googleapis.com/auth/monitoring',
  ],
//   preemptible: true,
};

export const cluster = new google.container.v1.Cluster(
  'core-cluster',
  {
    initialClusterVersion: engineVersion,
    nodePools: [
      {
        config: nodeConfig,
        locations: [zone],
        initialNodeCount: 3,
        management: {
          autoRepair: false,
        },
        name: 'initial',
      },
    ],
  },
  { provider: mainProvider },
);
