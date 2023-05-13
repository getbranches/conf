import { Config } from '@pulumi/pulumi';
import { GithubWithDockerService } from '../components/github-with-docker-service';
import { getGithubProvider } from '../github/providers';
import { googleProviders } from '../google/project';

new GithubWithDockerService(
  'procore-abax',
  {
    repo: 'procore-abax',
  },
  { providers: [getGithubProvider('procore-abax'), ...googleProviders] },
);
