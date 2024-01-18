import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { region } from '../config';
import { apiServices, mainClassicProvider } from '../google/project';

const config = new pulumi.Config('branches-main');

export const ipAddress = new gcp.compute.Address(
  'branches-main-address',
  {
    name: 'branches-main-address',
    addressType: 'EXTERNAL',
    region,
  },
  { provider: mainClassicProvider, dependsOn: apiServices, protect: true },
);

export const zone = new gcp.dns.ManagedZone(
  'branches-main-zone',
  {
    name: 'branches-main-zone',
    dnsName: config.require('dns-name'),
    description: 'Branches zone',
  },
  { provider: mainClassicProvider, dependsOn: apiServices },
);
