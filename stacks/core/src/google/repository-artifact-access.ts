import * as gcp from "@pulumi/gcp";
import { artifactRepository } from "./artifact-registry";
import { getIdentityPoolMemberByOwner } from "./identity-pool-github";
import * as pulumi from "@pulumi/pulumi";
import * as githubConfig from "../github/config";

export const artifactServiceAccount = new gcp.serviceaccount.Account(
	"artifact-sa",
	{
		accountId: "artifact",
		displayName: "Artifact Registry Account",
		description:
			"Used to push new artifacts to Artifact Registry, i.e with GitHub",
	},
);

new gcp.artifactregistry.RepositoryIamMember("artifact-sa-access", {
	repository: artifactRepository.id,
	member: pulumi.interpolate`serviceAccount:${artifactServiceAccount.email}`,
	role: "roles/artifactregistry.writer",
});

new gcp.serviceaccount.IAMMember("iam-workload-global", {
	serviceAccountId: artifactServiceAccount.id,
	role: "roles/iam.workloadIdentityUser",
	member: getIdentityPoolMemberByOwner(githubConfig.owner),
});

new gcp.serviceaccount.IAMMember("iam-infra-token", {
	serviceAccountId: artifactServiceAccount.id,
	role: "roles/iam.serviceAccountTokenCreator",
	member: getIdentityPoolMemberByOwner(githubConfig.owner),
});
