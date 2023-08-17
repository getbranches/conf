import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export interface StandardDatabaseArgs {
  /**
   * The team that owns the deployment.
   * @default 'thebranches'
   */
  team?: string;

  /**
   * The image to use for the init container
   */
  initImage?: pulumi.Input<string>;

  /**
   * Tag of the image to use for the init container
   */
  initTag?: pulumi.Input<string>;

  /**
   * The username that owns the deployment.
   * Defaults to name if not provided.
   */
  username?: string;

  /**
   * The database that the deployment connects to.
   * Defaults to name if not provided.
   */
  database?: string;

  /**
   * The size of the database volume.
   * @default '10Gi'
   */
  sizeInGb?: pulumi.Input<string>;

  /**
   * PostgreSQL version.
   *
   * @default '15'
   */
  postgresqlVersion?: pulumi.Input<string>;

  /**
   * Number of instances.
   * @default 1
   */
  numberOfInstances?: pulumi.Input<number>;

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
}

export interface DatabaseDetails {
  secretName: pulumi.Input<string>;
  hostname: pulumi.Input<string>;
  /**
   * @default 5432
   */
  port?: pulumi.Input<number>;
  database: pulumi.Input<string>;
}

export class StandardDatabase extends pulumi.ComponentResource {
  readonly databaseName: pulumi.Output<string>;
  readonly databaseSecretName: pulumi.Output<string>;
  readonly serviceHostname: pulumi.Output<string>;
  readonly databaseDetails: pulumi.Output<DatabaseDetails>;

  constructor(
    name: string,
    args: StandardDatabaseArgs = {},
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('branches:k8s:standard-deployment', name, {}, opts);
    const {
      team = 'thebranches',
      initImage,
      initTag,
      username = name,
      database = name,
      sizeInGb = '10Gi',
      postgresqlVersion = '15',
      numberOfInstances = 1,
      resources = {
        cpu: '250m',
        memory: '512Mi',
      },
    } = args;

    // Where do we put this?
    const initDeployments = [
      {
        name: `${name}-init`,
        image: pulumi
          .all([initImage, initTag])
          .apply(imageParts => imageParts.join(':')),
        imagePullPolicy: 'IfNotPresent',
        command: ['pnpm', 'db:migrate:deploy'],
        envFrom, // how do we get env?
        env,
      },
    ];

    const dbCluster = new k8s.apiextensions.CustomResource(
      name,
      {
        kind: 'postgresql',
        apiVersion: 'acid.zalan.do/v1',
        metadata: {
          name: `${team}-${name}`,
          labels: {
            team,
          },
        },
        spec: {
          teamId: team,
          postgresql: {
            version: postgresqlVersion,
          },
          numberOfInstances,
          volume: {
            size: sizeInGb,
          },
          users: {
            [username]: [],
          },
          databases: {
            [database]: database,
          },
          // enableConnectionPooler: true,
          allowedSourceRanges: null,
          resources: {
            requests: resources,
            limits: resources,
          },
        },
      },
      { parent: this },
    );

    this.databaseName = pulumi.output(database);
    this.databaseSecretName = pulumi.interpolate`${username}.${dbCluster.metadata.name}.credentials.postgresql.${crd}`;
    this.serviceHostname = pulumi.interpolate`${dbCluster.metadata.name}.${dbCluster.metadata.namespace}.svc.cluster.local`;

    this.databaseDetails = pulumi.output({
      secretName: this.databaseSecretName,
      hostname: this.serviceHostname,
      port: 5432,
      database: database,
    });
  }
}
