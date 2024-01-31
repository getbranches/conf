import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import * as yaml from 'js-yaml';
import { StandardDatabase } from '../components/standard-database';
import { StandardDeployment } from '../components/standard-deployment';
import { matrixDataBucket } from '../matrix/google';
import { matrixK8sServiceAccount } from '../matrix/k8s';
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

const secret = new k8s.core.v1.Secret(
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
            report_stats: true,
            media_store_path: '/synapse/data/media_store',
            pid_file: '/synapse/data/homeserver.pid',
            signing_key_path: '/synapse/data/bjerk.io.signing.key',
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
    // securityContext: {
    //   fsGroup: 666,
    //   runAsGroup: 666,
    //   runAsUser: 666,
    // },
    image: config.require('synapse-image'),
    tag: config.require('synapse-tag'),
    host,
    annotations: {
      'gke-gcsfuse/volumes': 'true',
      'gke-gcsfuse/cpu-limit': '500m',
      'gke-gcsfuse/memory-limit': '1Gi',
      'gke-gcsfuse/ephemeral-storage-limit': '50Gi',
    },
    serviceAccountName: matrixK8sServiceAccount.metadata.name,
    healthCheckHttpPath: '/health',
    databaseDetails: synapseDatabase.databaseDetails,
    volumes: [
      {
        name: 'secrets',
        emptyDir: {},
        secret: {
          secretName: secret.metadata.name,
        },
      },
      {
        name: 'config',
        emptyDir: {},
        configMap: {
          name: homeserverConfig.metadata.name,
        },
      },
      {
        name: 'gcs-fuse-csi-ephemeral',
        csi: {
          driver: 'gcs.csi.infra.gke.io',
          readOnly: true,
          volumeAttributes: {
            bucketName: matrixDataBucket.name,
            mountOptions: 'implicit-dirs',
          },
        },
      },
    ],
    volumeMounts: [
      {
        name: 'secrets',
        mountPath: '/secrets',
      },
      {
        name: 'config',
        mountPath: '/config',
      },
      {
        name: 'gcs-fuse-csi-ephemeral',
        mountPath: '/synapse/data',
      },
    ],
    // This is needed to tell synapse to load the secrets and config from these files
    command: [
      '/start.py',
      'run',
      '--config-path=/config/homeserver.yaml',
      '--config-path=/secrets/secrets.yaml',
    ],
  },
  { providers: [provider] },
);
