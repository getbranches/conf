import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { interpolate } from '@pulumi/pulumi';
import { getIdentityPoolMember } from '../identity-pool';
import { mainClassicProvider } from '../main-project';
import { nullProvider } from '../utils';

export interface GithubGCPProjectProps {
  owner: string;
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
    super('bjerkio:github:GithubIdentityPoolIamMember', name, {}, opts);
    const { projectId, developers = [] } = args;

    this.project = new gcp.organizations.Project(
      name,
      {
        name: projectId,
        projectId,
      },
      { provider: nullProvider },
    );

    this.provider = new gcp.Provider(name, {
      project: this.project.projectId,
    });

    this.serviceAccount = new gcp.serviceaccount.Account(
      name,
      {
        accountId: name,
      },
      { provider: this.provider },
    );

    new gcp.projects.IAMMember(
      name,
      {
        member: interpolate`serviceAccount:${this.serviceAccount.email}`,
        role: 'roles/owner',
        project: this.project.projectId,
      },
      { provider: this.provider },
    );

    developers.map(developer => [
      new gcp.projects.IAMMember(
        `${developer}-viewer`,
        {
          member: interpolate`user:${developer}`,
          role: 'roles/viewer',
          project: this.project.projectId,
        },
        { provider: this.provider },
      ),
    ]);

    new gcp.serviceaccount.IAMMember(
      `iam-workload-${name}`,
      {
        serviceAccountId: this.serviceAccount.id,
        role: 'roles/iam.workloadIdentityUser',
        member: getIdentityPoolMember(args.owner, args.repo),
      },
      { provider: mainClassicProvider, deleteBeforeReplace: true },
    );

    new gcp.serviceaccount.IAMMember(
      `iam-infra-token-${name}`,
      {
        serviceAccountId: this.serviceAccount.id,
        role: 'roles/iam.serviceAccountTokenCreator',
        member: getIdentityPoolMember(args.owner, args.repo),
      },
      { provider: mainClassicProvider, deleteBeforeReplace: true },
    );
  }
}
