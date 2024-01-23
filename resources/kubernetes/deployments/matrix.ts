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
  'matrix-db',
  {
    username: databaseUser,
    database: databaseName,
  },
  { providers: [provider] },
);

const registrationSecret = config.requireSecret('registration-secret');

const secretVolume = new k8s.core.v1.Secret(
  'matrix-registration-secret',
  {
    metadata: {
      name: 'matrix-registration-secret',
    },
    stringData: {
      'secrets.yaml': registrationSecret.apply(s =>
        yaml.dump({
          registration_shared_secret: s,
        }),
      ),
    },
  },
  { provider },
);
const host = config.require('host');
export const homeserverConfig = new k8s.core.v1.ConfigMap(
  'matrix-homeserver-config',
  {
    metadata: {
      name: 'matrix-synapse-config',
    },
    data: {
      'homeserver.yaml': pulumi
        .output(synapseDatabase.databaseDetails.hostname)
        .apply(dbHost =>
          yaml.dump({
            server_name: 'bjerk.io',
            public_baseurl: `https://${host}`,
            enable_registration: true,
            enable_registration_captcha: true,
            registration_requires_token: true,
            database: {
              name: 'matrix-db',
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
    host,
    healthCheckHttpPath: '/health',
    databaseDetails: synapseDatabase.databaseDetails,
    volumes: [
      {
        name: 'secrets',
        secret: {
          secretName: secretVolume.metadata.name,
        },
      },
      {
        name: 'config',
        configMap: {
          name: homeserverConfig.metadata.name,
        },
      },
    ],
    // this command is needed to load the secrets and config in two separate files
    command: [
      'run',
      '--config-path=/homeserver.yaml',
      '--config-path=/secrets.yaml',
    ],
  },
  { providers: [provider] },
);
