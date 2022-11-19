import * as gcp from '@pulumi/gcp';
import * as github from '@pulumi/github';
import * as pulumi from '@pulumi/pulumi';
import { interpolate } from '@pulumi/pulumi';
import { folderId, githubToken } from '../config';
import {
  getIdentityPoolMember,
  identityPoolProvider,
} from '../main-project/identity-pool';
import { mainClassicProvider } from '../main-project/main-project';
import { nullProvider } from '../utils';

export interface GithubGCPProjectProps {
  owner?: string;
  repo: string;
  projectId: string;
  developers?: string[];
}

export class GithubGCPProject extends pulumi.ComponentResource {
  public readonly project: gcp.organizations.Project;
  public readonly provider: gcp.Provider;
  public readonly serviceAccount: gcp.serviceaccount.Account;

  constructor(
    name: string,
    args: GithubGCPProjectProps,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('bjerkio:github:GithubGCPProject', name, {}, opts);
    const { projectId, developers = [], repo, owner = 'getbranches' } = args;

    this.project = new gcp.organizations.Project(
      name,
      {
        name: projectId,
        projectId,
        folderId,
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

    developers.map(developer => [
      new gcp.projects.IAMMember(
        `${developer}-viewer`,
        {
          member: interpolate`user:${developer}`,
          role: 'roles/viewer',
          project: this.project.projectId,
        },
        { provider: this.provider, parent: this },
      ),
    ]);

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
  }
}
