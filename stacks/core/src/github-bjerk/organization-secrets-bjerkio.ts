import * as github from "@pulumi/github";
import * as pulumi from "@pulumi/pulumi";
import * as googleConfig from "../google/config";
import * as githubConfig from "./config";
import { identityPoolProvider } from "../google/identity-pool-github";
import { artifactRepository } from "../google/artifact-registry";
import { artifactServiceAccount } from "../google/repository-artifact-access";

const provider = new github.Provider("bjerkio-github", {
  owner: githubConfig.owner,
  token: githubConfig.token,
});

new github.ActionsOrganizationVariable(
  "bjerkio-google-project",
  {
    variableName: "BRANCHES_GOOGLE_PROJECT_ID",
    value: googleConfig.project,
    visibility: "private",
  },
  { provider }
);

new github.ActionsOrganizationVariable(
  "bjerkio-google-identity-provider",
  {
    variableName: "BRANCHES_WORKLOAD_IDENTITY_PROVIDER",
    value: identityPoolProvider.name,
    visibility: "private",
  },
  { provider }
);

new github.ActionsOrganizationVariable(
  "bjerkio-google-service-account",
  {
    variableName: "BRANCHES_ARTIFACT_SERVICE_ACCOUNT_EMAIL",
    value: artifactServiceAccount.email,
    visibility: "private",
  },
  { provider }
);

new github.ActionsOrganizationVariable(
  "bjerkio-google-container-repository",
  {
    variableName: "BRANCHES_CONTAINER_REGISTRY",
    value: pulumi.interpolate`${artifactRepository.location}-docker.pkg.dev/${googleConfig.project}/${artifactRepository.repositoryId}`,
    visibility: "private",
  },
  { provider }
);
