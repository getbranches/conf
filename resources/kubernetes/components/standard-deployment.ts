import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { invariant } from 'ts-invariant';
import { DatabaseDetails } from './standard-database';

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

export interface StandardDeploymentDeploymentArgs {
  name?: pulumi.Input<string>;

  /**
   * The image to use for the deployment.
   */
  image: pulumi.Input<string>;

  /**
   * Tag of the image to use for the deployment.
   */
  tag: pulumi.Input<string>;

  /**
   * The command to run in the container.
   */
  command?: pulumi.Input<string[]>;

  // TODO: Add support for env vars
  // /**
  //  * Environment variables
  //  */
  // env?: Record<string, pulumi.Input<string>>;
}

export interface StandardDeploymentArgs
  extends StandardDeploymentDeploymentArgs {
  /**
   * Init containers
   * @default []
   * @see https://kubernetes.io/docs/concepts/workloads/pods/init-containers/
   */
  initContainers?: pulumi.Input<
    pulumi.Input<StandardDeploymentDeploymentArgs>[]
  >;

  /**
   * Secrets are accessable for the application/pod as environment variables,
   * but stored in the cluster as secrets.
   */
  secretEnv?: Record<string, pulumi.Input<string>>;

  /**
   * Use a database with this deployment
   */
  databaseDetails?: pulumi.Input<DatabaseDetails>;

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

  /**
   * Volume represents a named volume in a pod that may be accessed by any container in the pod.
   */
  volumes?: pulumi.Input<k8s.types.input.core.v1.Volume>[];

  /**
   * Pod volumes to mount into the container's filesystem. Cannot be updated.
   */
  volumeMounts?: pulumi.Input<k8s.types.input.core.v1.VolumeMount>[];

  /**
   * SecurityContext holds pod-level security attributes and common container settings. Optional: Defaults to empty. See type description for default values of each field.
   */
  securityContext?: pulumi.Input<k8s.types.input.core.v1.PodSecurityContext>;

  /**
   * Arguments to the entrypoint. The container image's CMD is used if this is not provided.
   * Variable references $(VAR_NAME) are expanded using the container's environment.
   * If a variable cannot be resolved, the reference in the input string will be unchanged.
   *  Double $$ are reduced to a single $, which allows for escaping the $(VAR_NAME) syntax:
   * i.e. "$$(VAR_NAME)" will produce the string literal "$(VAR_NAME)".
   * Escaped references will never be expanded, regardless of whether the variable exists or not.
   * Cannot be updated. More info: https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/#running-a-command-in-a-shell
   */
  args?: pulumi.Input<pulumi.Input<string>[]>;
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
      command,
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
      initContainers = [],
      volumes = [],
      args: entrypointArgs = undefined,
      volumeMounts = [],
      securityContext = undefined,
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

    if (args.databaseDetails) {
      envFrom.push({
        prefix: 'POSTGRES_',
        secretRef: {
          name: pulumi
            .output(args.databaseDetails)
            .apply(details => details.secretName),
        },
      });

      env.push({
        name: 'DATABASE_URL',
        value: pulumi
          .output(args.databaseDetails)
          .apply(
            details =>
              `postgres://$(POSTGRES_username):$(POSTGRES_password)@${
                details.hostname
              }:${details.port ?? 5432}/${details.database}?sslmode=require`,
          ),
      });
    }

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
              securityContext,
              volumes,
              initContainers: pulumi.output(initContainers).apply(ic =>
                ic.map(initContainer => ({
                  name: initContainer.name ?? `${name}-init`,
                  image: pulumi
                    .all([initContainer.image, initContainer.tag])
                    .apply(imageParts => imageParts.join(':')),
                  imagePullPolicy: 'IfNotPresent',
                  command: initContainer.command,
                  envFrom,
                  env,
                })),
              ),
              containers: [
                {
                  volumeMounts,
                  name,
                  image: pulumi
                    .all([image, tag])
                    .apply(imageParts => imageParts.join(':')),
                  imagePullPolicy: 'IfNotPresent',
                  command,
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
                  args: entrypointArgs,
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
