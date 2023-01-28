import * as k8s from '@pulumi/kubernetes';
import { provider } from '../provider';
import { volumeClaim } from './data-claim';

export const port = 9001;

export const deployment = new k8s.apps.v1.Deployment(
  'lhci-deployment',
  {
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'lhci',
        },
      },
      template: {
        metadata: {
          labels: {
            app: 'lhci',
          },
        },
        spec: {
          containers: [
            {
              name: 'lhci',
              image: 'docker.io/patrickhulce/lhci-server:0.10.0',
              imagePullPolicy: 'IfNotPresent',
              ports: [{ containerPort: port }],
              env: [
                {
                  name: 'LHCI_SERVER_PORT',
                  value: String(port),
                },
              ],
              readinessProbe: {
                httpGet: {
                  path: '/healthz',
                  port: port,
                },
                initialDelaySeconds: 5,
              },
              volumeMounts: [
                {
                  name: 'lhci-data',
                  mountPath: '/data',
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'lhci-data',
              persistentVolumeClaim: {
                claimName: volumeClaim.metadata.name,
              },
            },
          ],
        },
      },
    },
  },
  { provider },
);

export const service = new k8s.core.v1.Service(
  'lhci-service',
  {
    spec: {
      ports: [{ port }],
      selector: deployment.spec.selector.matchLabels,
    },
  },
  { provider },
);
