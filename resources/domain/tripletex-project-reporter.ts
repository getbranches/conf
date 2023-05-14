import { GithubWithDockerService } from '../components/github-with-docker-service';
import { getGithubProvider } from '../github/providers';
import { googleProviders } from '../google/project';

new GithubWithDockerService(
  'tripletex-project-reporter',
  {
    repo: 'tripletex-project-reporter',
  },
  { providers: [getGithubProvider('getbranches'), ...googleProviders] },
);
