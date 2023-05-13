import * as github from '@pulumi/github';

const githubProviders = new Map<string, github.Provider>();

export function getGithubProvider(owner: string): github.Provider {
  if (!githubProviders.has(owner)) {
    githubProviders.set(
      owner,
      new github.Provider(owner, {
        owner,
      }),
    );
  }

  const provider = githubProviders.get(owner);

  if (!provider) {
    throw new Error(`Could not find provider for ${owner}`);
  }

  return provider;
}
