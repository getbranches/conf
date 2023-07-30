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
   * @default 'public'
   */
  name: pulumi.Input<string>;
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

  /**
   * Secrets are accessable for the application/pod as environment variables,
   * but stored in the cluster as secrets.
   */
  secretEnv?: Record<string, pulumi.Input<string>>;

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
 */
export class StandardDeployment extends pulumi.CustomResource {
  readonly deployment: k8s.apps.v1.Deployment;

  readonly service?: k8s.core.v1.Service;
  readonly ingress?: k8s.networking.v1.Ingress;

  constructor(
    name: string,
    args: StandardDeploymentArgs,
    opts?: pulumi.CustomResourceOptions,
  ) {
    super('branches:standard-deployment', name, args, opts);

    const {
      secretEnv,
      image,
      tag,
      ports = [
        {
          port: 8080,
          name: 'public',
        },
      ],
      host,
      resources = {
        cpu: '250m',
        memory: '512Mi',
      },
      createIngress = true,
      createService = true,
    } = args;

    const webPort = ports.find(p => p.name === 'public');

    const env: pulumi.Input<pulumi.Input<k8s.types.input.core.v1.EnvVar>[]> = [
      {
        name: 'NODE_ENV',
        value: 'production',
      },
    ];

    if (webPort) {
      env.push({
        name: 'PORT',
        value: pulumi.output(webPort.port).apply(p => p.toString()),
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
      const secret = new k8s.core.v1.Secret(
        name,
        {
          metadata: {
            name,
          },
          stringData: secretEnv,
        },
        { parent: this },
      );

      envFrom.push({
        secretRef: {
          name: secret.metadata.name,
        },
      });
    }

    const probe = {
      httpGet: webPort
        ? {
            path: '/health',
            port: webPort.port,
          }
        : undefined,
    };

    this.deployment = new k8s.apps.v1.Deployment(
      `${name}-deployment`,
      {
        metadata: {
          name,
          annotations: {
            'pulumi.com/skipAwait': 'true',
          },
        },
        spec: {
          replicas: 1,
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
      { parent: this },
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
            selector: this.deployment.spec.template.metadata.labels,
            ports: ports.map(p => ({
              port: p.port,
              name: p.name,
            })),
          },
        },
        { parent: this },
      );
    }

    if (createIngress) {
      invariant(this.service, 'Service must be created to create an ingress');
      invariant(host, 'Host must be defined to create an ingress');
      invariant(webPort, 'Web port must be defined to create an ingress');

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
                          port: { name: webPort.name },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        { parent: this },
      );
    }
  }
}
