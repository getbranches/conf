import { Config } from '@pulumi/pulumi';
import { GithubWithDockerService } from '../components/github-with-docker-service';

const config = new Config('todoist-github-bot');

new GithubWithDockerService('todoist-github-bot', {
  repo: 'todoist-github-bot',
  projectId: 'todoist-github-bot',
  developers: config.requireObject<string[]>('developers'),
  apis: ['run.googleapis.com'],
});
