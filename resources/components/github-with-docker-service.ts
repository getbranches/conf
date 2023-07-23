import * as gcp from '@pulumi/gcp';
import * as github from '@pulumi/github';
import * as pulumi from '@pulumi/pulumi';
import { interpolate } from '@pulumi/pulumi';
import { artifactRepository } from '../google/artifact-registry';
import {
  getIdentityPoolMember,
  identityPoolProvider,
} from '../google/identity-pool';
import { mainClassicProvider, project } from '../google/project';

export interface GithubWithDockerServiceProps {
  owner?: string;
  repo: string;

  // @deprecated
  developers?: string[];

  // @deprecated
  apis?: string[];
  // @deprecated
  projectId?: string;
}

export class GithubWithDockerService extends pulumi.ComponentResource {
  public readonly serviceAccount: gcp.serviceaccount.Account;

  constructor(
    name: string,
    args: GithubWithDockerServiceProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('bjerkio:github:github-with-docker-service', name, {}, opts);
    const { projectId, developers = [], repo, owner = 'getbranches' } = args;

    this.serviceAccount = new gcp.serviceaccount.Account(
      name,
      {
        accountId: name,
      },
      { parent: this },
    );

    new gcp.projects.IAMMember(
      name,
      {
        member: interpolate`serviceAccount:${this.serviceAccount.email}`,
        role: 'roles/owner',
        project: project.projectId,
      },
      { parent: this },
    );

    new gcp.serviceaccount.IAMMember(
      `iam-workload-${name}`,
      {
        serviceAccountId: this.serviceAccount.id,
        role: 'roles/iam.workloadIdentityUser',
        member: getIdentityPoolMember(owner, repo),
      },
      {
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

    new gcp.artifactregistry.RepositoryIamMember(
      name,
      {
        repository: artifactRepository.id,
        member: interpolate`serviceAccount:${this.serviceAccount.email}`,
        role: 'roles/artifactregistry.writer',
      },
      { parent: this },
    );

    new github.ActionsSecret(
      `${name}-google-projects`,
      {
        repository: repo,
        secretName: 'GOOGLE_PROJECT_ID',
        plaintextValue: projectId,
      },
      { parent: this, deleteBeforeReplace: true },
    );

    new github.ActionsSecret(
      `${name}-identity-provider`,
      {
        repository: repo,
        secretName: 'WORKLOAD_IDENTITY_PROVIDER',
        plaintextValue: identityPoolProvider.name,
      },
      { parent: this, deleteBeforeReplace: true },
    );

    new github.ActionsSecret(
      `${name}-service-account`,
      {
        repository: repo,
        secretName: 'SERVICE_ACCOUNT_EMAIL',
        plaintextValue: this.serviceAccount.email,
      },
      { parent: this, deleteBeforeReplace: true },
    );

    new github.ActionsSecret(
      `${name}-container-repository`,
      {
        repository: repo,
        secretName: 'CONTAINER_REGISTRY',
        plaintextValue: interpolate`${artifactRepository.location}-docker.pkg.dev/${project.projectId}/${artifactRepository.repositoryId}`,
      },
      { parent: this, deleteBeforeReplace: true },
    );

    developers.map(developer => [
      new gcp.artifactregistry.RepositoryIamMember(
        `${name}-docker-registry-${developer}`,
        {
          repository: artifactRepository.id,
          member: interpolate`user:${developer}`,
          role: 'roles/artifactregistry.writer',
        },
        { parent: this },
      ),
    ]);
  }
}
