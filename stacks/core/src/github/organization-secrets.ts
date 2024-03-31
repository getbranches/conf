import * as github from "@pulumi/github";
import * as pulumi from "@pulumi/pulumi";
import * as googleConfig from "../google/config";
import * as githubConfig from './config';
import { identityPoolProvider } from "../google/identity-pool-github";
import {
  artifactRepository,
} from "../google/artifact-registry";
import { artifactServiceAccount } from "../google/repository-artifact-access";

const provider = new github.Provider("github", {
  owner: githubConfig.owner,
  token: githubConfig.token,
});

new github.ActionsOrganizationVariable(
  "google-project",
  {
    variableName: "GOOGLE_PROJECT_ID",
    value: googleConfig.project,
    visibility: "private",
  },
  { provider },
);

new github.ActionsOrganizationVariable(
  "google-identity-provider",
  {
    variableName: "WORKLOAD_IDENTITY_PROVIDER",
    value: identityPoolProvider.name,
    visibility: "private",
  },
  { provider },
);

new github.ActionsOrganizationVariable(
  "google-service-account",
  {
    variableName: "ARTIFACT_SERVICE_ACCOUNT_EMAIL",
    value: artifactServiceAccount.email,
    visibility: "private",
  },
  { provider },
);

new github.ActionsOrganizationVariable(
  "google-container-repository",
  {
    variableName: "CONTAINER_REGISTRY",
    value: pulumi
      .interpolate`${artifactRepository.location}-docker.pkg.dev/${googleConfig.project}/${artifactRepository.repositoryId}`,
    visibility: "private",
  },
  { provider },
);