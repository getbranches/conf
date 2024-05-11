import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as config from "./config";

export const artifactRepository = new gcp.artifactregistry.Repository(
  "docker-registry",
  {
    cleanupPolicyDryRun: true,
    format: "DOCKER",
    location: config.region,
    project: config.project,
    repositoryId: "branches-org-main",
  },
  {
    protect: true,
  },
);

export const artifactUri = pulumi.interpolate`${artifactRepository.location}-docker.pkg.dev/${config.project}/${artifactRepository.repositoryId}`;