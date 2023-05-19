import * as gcp from '@pulumi/gcp';
import { region } from '../config';
import { apiServices, mainClassicProvider, project } from './project';

export const artifactRepository = new gcp.artifactregistry.Repository(
  'artifact-registry',
  {
    repositoryId: project.projectId,
    location: region,
    format: 'DOCKER',
  },
  { provider: mainClassicProvider, dependsOn: apiServices },
);
