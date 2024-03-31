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
