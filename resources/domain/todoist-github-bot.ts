import { Config } from '@pulumi/pulumi';
import { GithubGCPProject } from '../components/github-gcp-project';

const config = new Config('todoist-github-bot');

new GithubGCPProject('todoist-github-bot', {
  repo: 'todoist-github-bot',
  projectId: 'todoist-github-bot',
  developers: config.requireObject<string[]>('developers'),
  apis: ['run.googleapis.com'],
});
