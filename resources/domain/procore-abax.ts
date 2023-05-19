import { GithubWithDockerService } from '../components/github-with-docker-service';
import { getGithubProvider } from '../github/providers';
import { googleProviders } from '../google/project';

new GithubWithDockerService(
  'procore-abax',
  {
    repo: 'procore-abax',
  },
  { providers: [getGithubProvider('getbranches'), ...googleProviders] },
);
