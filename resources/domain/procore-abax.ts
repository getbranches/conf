import { Config } from '@pulumi/pulumi';
import { GithubGCPProject } from '../components/github-gcp-project';

const config = new Config('procore-abax');

new GithubGCPProject('procore-abax', {
  repo: 'procore-abax',
  projectId: 'procore-abax',
  developers: config.requireObject<string[]>('developers'),
});
