import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { mainClassicProvider } from '../google/project';
import { ipAddress, zone } from './branches';

const abaxVwfsConfig = new pulumi.Config('abax-vwfs');

const ingressIpAddress = ipAddress.address;

new gcp.dns.RecordSet(
  'portal-app-ipv4',
  {
    managedZone: zone.name,
    name: `${abaxVwfsConfig.require('host')}.`,
    type: 'A',
    ttl: 300,
    rrdatas: [ingressIpAddress],
  },
  { provider: mainClassicProvider, dependsOn: [ipAddress, zone] },
);
