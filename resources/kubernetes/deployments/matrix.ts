import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import * as yaml from 'js-yaml';
import { StandardDatabase } from '../components/standard-database';
import { StandardDeployment } from '../components/standard-deployment';
import { provider } from '../provider';

const config = new pulumi.Config('matrix');

const databaseUser = 'matrix';
const databaseName = 'matrix';

export const synapseDatabase = new StandardDatabase(
  'matrix-synapse-db',
  {
    username: databaseUser,
    database: databaseName,
  },
  { providers: [provider] },
);

const host = config.require('host');

export const homeserverConfig = new k8s.core.v1.ConfigMap(
  'matrix-homeserver-config',
  {
    metadata: {
      name: 'matrix-synapse-config',
    },
    data: {
      'homeserver.yml': synapseDatabase.databaseDetails.hostname.apply(dbHost =>
        yaml.dump({
          server_name: 'Branches Matrix Server',
          public_baseurl: `https://${host}`,
          enable_registration: true,
          enable_registration_captcha: true,

          database: {
            name: 'syndb',
            args: {
              user: databaseUser,
              dbname: databaseName,
              host: dbHost,
              cp_min: 5,
              cp_max: 10,
            },
          },
        }),
      ),
    },
  },
  { provider },
);

export const synapseDeployment = new StandardDeployment(
  'matrix-synapse',
  {
    image: config.require('synapse-image'),
    tag: config.require('synapse-tag'),
    host: config.require('host'),
    secretEnv: {
      SYNAPSE_CONFIG_DIR: '/data',
      SYNAPSE_CONFIG_PATH: '/data/homeserver.yaml',
    },
    healthCheckHttpPath: '/',
    databaseDetails: synapseDatabase.databaseDetails,
    volumes: [
      {
        name: 'data',
        configMap: {
          name: 'homeserver-config',
        },
      },
    ],
  },
  { providers: [provider] },
);
