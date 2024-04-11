import "./google/artifact-registry";
import "./google/identity-pool-github.ts";
import "./github/organization-secrets";
import "./google/gke";
import "./google/database";
import "./kubernetes/ingress-controller.chart";
import "./google/iam";
import { kubeconfig } from "./kubeconfig";
import { database, gcpServiceAccount } from "./google/database";

export {
  kubeconfig,
};

export const databaseConnectionName = database.connectionName;
export const databaseInstanceName = database.name;
export const databaseServiceAccountId = gcpServiceAccount.name;
export const databaseServiceAccountEmail = gcpServiceAccount.email;