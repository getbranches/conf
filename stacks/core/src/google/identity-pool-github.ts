import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const identityPool = new gcp.iam.WorkloadIdentityPool("github", {
	disabled: false,
	workloadIdentityPoolId: "github",
});

export const identityPoolProvider = new gcp.iam.WorkloadIdentityPoolProvider(
	"github",
	{
		workloadIdentityPoolId: identityPool.workloadIdentityPoolId,
		workloadIdentityPoolProviderId: "github",
		oidc: {
			issuerUri: "https://token.actions.githubusercontent.com",
		},
		attributeMapping: {
			"google.subject": "assertion.sub",
			"attribute.actor": "assertion.actor",
			"attribute.repository": "assertion.repository",
			"attribute.repository_owner": "assertion.repository_owner",
		},
	},
);

export const getIdentityPoolMemberByRepo = (
	owner: string,
	repo: string,
): pulumi.Output<string> =>
	pulumi.interpolate`principalSet://iam.googleapis.com/${identityPool.name}/attribute.repository/${owner}/${repo}`;

export const getIdentityPoolMemberByOwner = (
	owner: string,
): pulumi.Output<string> =>
	pulumi.interpolate`principalSet://iam.googleapis.com/${identityPool.name}/attribute.repository_owner/${owner}`;
