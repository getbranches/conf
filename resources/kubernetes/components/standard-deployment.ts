import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { invariant } from 'ts-invariant';

export interface StandardDeploymentPort {
  /**
   * The port that the application is listening on.
   */
  port: pulumi.Input<number>;

  /**
   * The name of the port.
   *
   * Port named "public" is used for the ingress and injected as environment
   * variable called "PORT".
   *
   * The name of this port within the service. This must be a DNS_LABEL.
   * All ports within a deployment must have unique names.
   *
   * @default 'public'
   */
  name: pulumi.Input<string>;

  /**
   * The protocol that the application is listening on.
   * @default 'TCP'
   * @see https://kubernetes.io/docs/concepts/services-networking/service/#protocol
   */
  protocol?: pulumi.Input<string>;
}

export interface StandardDeploymentArgs {
  /**
   * The image to use for the deployment.
   */
  image: pulumi.Input<string>;

  /**
   * Tag of the image to use for the deployment.
   */
  tag: pulumi.Input<string>;

  // TODO: Add support for env vars
  // /**
  //  * Environment variables
  //  */
  // env?: Record<string, pulumi.Input<string>>;

  /**
   * Secrets are accessable for the application/pod as environment variables,
   * but stored in the cluster as secrets.
   */
  secretEnv?: Record<string, pulumi.Input<string>>;

  /**
   * Log level
   * @default 'info'
   * @allowedValues 'trace', 'debug', 'info', 'warn', 'error', 'fatal'
   */
  logLevel?: pulumi.Input<
    'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  >;

  /**
   * The number of replicas to run.
   * @default 1
   * @see https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#replicas
   * @see https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot#replicas
   */
  replicas?: pulumi.Input<number>;

  /**
   * The ports that the application is listening on.
   *
   * @default [
   *  {
   *    port: 8080,
   *    name: 'public',
   *  },
   * ]
   */
  ports?: StandardDeploymentPort[];

  /**
   * @default {
   *  cpu: '250m',
   *  memory: '512Mi',
   * }
   * @see https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-resource-requests
   */
  resources?: {
    cpu?: pulumi.Input<string>;
    memory?: pulumi.Input<string>;
  };

  /**
   * The host for the application. This is used to set the SELF_URL environment
   * variable and define the ingress host.
   */
  host?: pulumi.Input<string>;

  /**
   * The path that the health check is listening on.
   * @default '/health'
   */
  healthCheckHttpPath?: pulumi.Input<string>;

  createIngress?: boolean;
  createService?: boolean;
}

/**
 * Custom Pulumi component for deploying a Kubernetes deployment.
 *
 * This component is opinionated and is not intended to be used for all
 * deployments. It is intended to be used for deployments that are similar to
 * typically deployments at Branches.
 *
 * The motivation behind this component is to provide a simple way to deploy a
 * Kubernetes deployment with a single class, where methods represents typical
 * resources that are needed to deploy a deployment.
 *
 * The service requires a `/health` endpoint to be exposed. This is used for
 * health checks.
 *
 * @example
 * ```ts
 * import { StandardDeployment } from '@branches/kubernetes';
 *
 * const config = new pulumi.Config('unleash');
 *
 * const host = config.require('host');
 * const image = config.require('ext-image');
 *
 * const deployment = new StandardDeployment('unleash', {
 *  image,
 *  tag: 'latest',
 *  host,
 * });
 * ```
 */
export class StandardDeployment extends pulumi.ComponentResource {
  readonly deployment: k8s.apps.v1.Deployment;

  readonly service?: k8s.core.v1.Service;
  readonly ingress?: k8s.networking.v1.Ingress;
  readonly secret?: k8s.core.v1.Secret;

  constructor(
    name: string,
    args: StandardDeploymentArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('branches:k8s:standard-deployment', name, {}, opts);
    const {
      secretEnv,
      image,
      tag,
      replicas = 1,
      ports = [
        {
          port: 8080,
          name: 'public',
        },
      ],
      host,
      logLevel = 'info',
      resources = {
        cpu: '250m',
        memory: '512Mi',
      },
      healthCheckHttpPath = '/health',
      createIngress = true,
      createService = true,
    } = args;

    const publicPort = ports.find(p => p.name === 'public');

    const env: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.EnvVar>[]> = [
      {
        name: 'NODE_ENV',
        value: 'production',
      },
      {
        name: 'LOG_LEVEL',
        value: logLevel,
      },
    ];

    if (publicPort) {
      env.push({
        name: 'PORT',
        value: pulumi.output(publicPort.port).apply(p => p.toString()),
      });
    }

    if (host) {
      env.push({
        name: 'SELF_URL',
        value: pulumi.output(host).apply(h => `https://${h}`),
      });
    }

    const envFrom: pulumi.Input<
      pulumi.Input<k8s.types.input.core.v1.EnvFromSourcePatch>[]
    > = [];

    if (secretEnv) {
      this.secret = new k8s.core.v1.Secret(
        name,
        {
          metadata: {
            name: `${name}-env-config`,
          },
          stringData: secretEnv,
        },
        {
          parent: this,
          aliases: [
            { parent: pulumi.rootStackResource },
            { parent: pulumi.rootStackResource, name: `${name}-secrets` },
          ],
        },
      );

      envFrom.push({
        secretRef: {
          name: this.secret.metadata.name,
        },
      });
    }

    const probe = {
      httpGet: publicPort
        ? {
            path: healthCheckHttpPath,
            port: publicPort.port,
          }
        : undefined,
    };

    this.deployment = new k8s.apps.v1.Deployment(
      name,
      {
        metadata: {
          name,
          annotations: {
            'pulumi.com/skipAwait': 'true',
          },
        },
        spec: {
          replicas,
          selector: {
            matchLabels: {
              app: name,
            },
          },
          template: {
            metadata: {
              labels: {
                app: name,
              },
            },
            spec: {
              containers: [
                {
                  name,
                  image: pulumi
                    .all([image, tag])
                    .apply(imageParts => imageParts.join(':')),
                  imagePullPolicy: 'IfNotPresent',
                  ports: ports.map(p => ({
                    containerPort: p.port,
                    protocol: p.protocol ?? 'TCP',
                    name: p.name,
                  })),
                  readinessProbe: probe,
                  envFrom,
                  resources: {
                    requests: resources,
                  },
                  env,
                },
              ],
            },
          },
        },
      },
      {
        parent: this,
        aliases: [
          { parent: pulumi.rootStackResource },
          { parent: pulumi.rootStackResource, name: `${name}-deployment` },
        ],
      },
    );

    if (createService) {
      this.service = new k8s.core.v1.Service(
        name,
        {
          metadata: {
            name,
            annotations: {
              'pulumi.com/skipAwait': 'true',
            },
          },
          spec: {
            ports: ports.map(p => ({
              name: p.name,
              port: p.port,
              protocol: p.protocol ?? 'TCP',
              targetPort: p.port,
            })),
            selector: this.deployment.spec.template.metadata.labels,
          },
        },
        {
          parent: this,
          aliases: [
            { parent: pulumi.rootStackResource },
            { parent: pulumi.rootStackResource, name: `${name}-service` },
          ],
        },
      );
    }

    if (createIngress && !createService) {
      pulumi.log.warn(
        'Ingress cannot be created without a service. Skipping ingress creation.',
      );
    }

    if (createIngress && createService) {
      invariant(this.service, 'Service must be created to create an ingress');
      invariant(host, 'Host must be defined to create an ingress');
      invariant(publicPort, 'Web port must be defined to create an ingress');

      this.ingress = new k8s.networking.v1.Ingress(
        name,
        {
          metadata: {
            name,
            annotations: {
              'kubernetes.io/ingress.class': 'caddy',
              'pulumi.com/skipAwait': 'true',
            },
          },
          spec: {
            rules: [
              {
                host,
                http: {
                  paths: [
                    {
                      path: '/',
                      pathType: 'Prefix',
                      backend: {
                        service: {
                          name: this.service.metadata.name,
                          port: { number: publicPort.port },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          parent: this,
          deleteBeforeReplace: true,
          aliases: [
            { parent: pulumi.rootStackResource },
            { parent: pulumi.rootStackResource, name: `${name}-ingress` },
          ],
        },
      );
    }
  }
}
