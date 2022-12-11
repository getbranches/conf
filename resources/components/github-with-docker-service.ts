import * as gcp from '@pulumi/gcp';
import * as github from '@pulumi/github';
import * as pulumi from '@pulumi/pulumi';
import { interpolate } from '@pulumi/pulumi';
import { billingAccountId, folderId, githubToken, region } from '../config';
import {
  getIdentityPoolMember,
  identityPoolProvider,
} from '../main-project/identity-pool';
import { mainClassicProvider } from '../main-project/main-project';
import { nullProvider } from '../utils';

export interface GithubWithDockerServiceProps {
  owner?: string;
  repo: string;
  projectId: string;
  developers?: string[];
  apis?: string[];
}

const defaultApis = [
  'servicemanagement.googleapis.com',
  'servicecontrol.googleapis.com',
  'container.googleapis.com',
  'compute.googleapis.com',
  'dns.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'logging.googleapis.com',
  'stackdriver.googleapis.com',
  'monitoring.googleapis.com',
  'cloudtrace.googleapis.com',
  'clouderrorreporting.googleapis.com',
  'clouddebugger.googleapis.com',
  'cloudprofiler.googleapis.com',
  'sqladmin.googleapis.com',
  'cloudkms.googleapis.com',
  'cloudfunctions.googleapis.com',
  'cloudbuild.googleapis.com',
  'iam.googleapis.com',
  'iap.googleapis.com',
  'artifactregistry.googleapis.com',
  'identitytoolkit.googleapis.com',
  'cloudbilling.googleapis.com',
];

export class GithubWithDockerService extends pulumi.ComponentResource {
  public readonly project: gcp.organizations.Project;
  public readonly provider: gcp.Provider;
  public readonly serviceAccount: gcp.serviceaccount.Account;

  constructor(
    name: string,
    args: GithubWithDockerServiceProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('bjerkio:github:github-with-docker-service', name, {}, opts);
    const {
      projectId,
      developers = [],
      apis = [],
      repo,
      owner = 'getbranches',
    } = args;

    this.project = new gcp.organizations.Project(
      name,
      {
        name: projectId,
        projectId,
        folderId,
        billingAccount: billingAccountId,
      },
      { provider: nullProvider, parent: this },
    );

    this.provider = new gcp.Provider(
      name,
      {
        project: this.project.projectId,
      },
      { parent: this },
    );

    this.serviceAccount = new gcp.serviceaccount.Account(
      name,
      {
        accountId: name,
      },
      { provider: this.provider, parent: this },
    );

    new gcp.projects.IAMMember(
      name,
      {
        member: interpolate`serviceAccount:${this.serviceAccount.email}`,
        role: 'roles/owner',
        project: this.project.projectId,
      },
      { provider: this.provider, parent: this },
    );

    new gcp.serviceaccount.IAMMember(
      `iam-workload-${name}`,
      {
        serviceAccountId: this.serviceAccount.id,
        role: 'roles/iam.workloadIdentityUser',
        member: getIdentityPoolMember(owner, repo),
      },
      {
        provider: mainClassicProvider,
        deleteBeforeReplace: true,
        parent: this,
      },
    );

    new gcp.serviceaccount.IAMMember(
      `iam-infra-token-${name}`,
      {
        serviceAccountId: this.serviceAccount.id,
        role: 'roles/iam.serviceAccountTokenCreator',
        member: getIdentityPoolMember(owner, repo),
      },
      {
        parent: this,
        provider: mainClassicProvider,
        deleteBeforeReplace: true,
      },
    );

    const apiServices = [...apis, ...defaultApis].map(
      service =>
        new gcp.projects.Service(
          `${name}-${service}`,
          {
            service,
            disableOnDestroy: false,
          },
          { provider: this.provider },
        ),
    );

    const dockerRepo = new gcp.artifactregistry.Repository(
      name,
      {
        repositoryId: this.project.projectId,
        location: region,
        format: 'DOCKER',
      },
      { parent: this, provider: this.provider, dependsOn: apiServices },
    );

    new gcp.artifactregistry.RepositoryIamMember(
      name,
      {
        repository: dockerRepo.id,
        member: interpolate`serviceAccount:${this.serviceAccount.email}`,
        role: 'roles/artifactregistry.writer',
      },
      { parent: this, provider: this.provider },
    );

    const githubProvider = new github.Provider(
      name,
      { owner, token: githubToken },
      { parent: this },
    );

    new github.ActionsSecret(
      `${name}-google-projects`,
      {
        repository: repo,
        secretName: 'GOOGLE_PROJECT_ID',
        plaintextValue: projectId,
      },
      { provider: githubProvider, parent: this, deleteBeforeReplace: true },
    );

    new github.ActionsSecret(
      `${name}-identity-provider`,
      {
        repository: repo,
        secretName: 'WORKLOAD_IDENTITY_PROVIDER',
        plaintextValue: identityPoolProvider.name,
      },
      { provider: githubProvider, parent: this, deleteBeforeReplace: true },
    );

    new github.ActionsSecret(
      `${name}-service-account`,
      {
        repository: repo,
        secretName: 'SERVICE_ACCOUNT_EMAIL',
        plaintextValue: this.serviceAccount.email,
      },
      { provider: githubProvider, parent: this, deleteBeforeReplace: true },
    );

    new github.ActionsSecret(
      `${name}-docker-repository`,
      {
        repository: repo,
        secretName: 'DOCKER_REPOSITORY',
        plaintextValue: interpolate`${dockerRepo.location}-docker.pkg.dev/${this.project.projectId}/${dockerRepo.repositoryId}`,
      },
      { provider: githubProvider, parent: this, deleteBeforeReplace: true },
    );

    developers.map(developer => [
      new gcp.projects.IAMMember(
        `${name}-${developer}-viewer`,
        {
          member: interpolate`user:${developer}`,
          role: 'roles/viewer',
          project: this.project.projectId,
        },
        { provider: this.provider, parent: this },
      ),
      new gcp.artifactregistry.RepositoryIamMember(
        `${name}-docker-registry-${developer}`,
        {
          repository: dockerRepo.id,
          member: interpolate`user:${developer}`,
          role: 'roles/artifactregistry.writer',
        },
        { provider: this.provider, parent: this },
      ),
    ]);
  }
}
