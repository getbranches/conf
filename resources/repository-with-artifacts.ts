import { GithubWithDockerService } from './components/github-with-docker-service';
import { getGithubProvider } from './github/providers';
import { googleProviders } from './google/project';

const repos = [
  'abax-procore', //
  'tripletex-project-reporter',
  'abax-minuba',
  'abax-vwfs',
];

repos.map(
  repo =>
    new GithubWithDockerService(
      repo,
      {
        repo: repo,
      },
      // TODO: Add support for other repos, if we need.
      { providers: [getGithubProvider('getbranches'), ...googleProviders] },
    ),
);
