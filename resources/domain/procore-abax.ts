import { Config } from '@pulumi/pulumi';
import { GithubWithDockerService } from '../components/github-with-docker-service';

const config = new Config('procore-abax');

new GithubWithDockerService('procore-abax', {
  repo: 'procore-abax',
  projectId: 'procore-abax',
  developers: config.requireObject<string[]>('developers'),
  apis: ['run.googleapis.com'],
});
