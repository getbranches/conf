import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import * as googleConfig from "./config";

export const database = new gcp.sql.DatabaseInstance("main", {
  name: "main",
  databaseVersion: "POSTGRES_15",
  region: googleConfig.region,
  deletionProtection: true,
  settings: {
    tier: "db-f1-micro",
    deletionProtectionEnabled: true,
    backupConfiguration: {
      enabled: true,
      binaryLogEnabled: true,
      pointInTimeRecoveryEnabled: true,
      startTime: "03:00",
    },
  },
}, { protect: true });

export const gcpServiceAccount = new gcp.serviceaccount.Account("databaseaccess", {
  accountId: "maindbaccess",
  project: googleConfig.project,
});

new gcp.projects.IAMMember("databaseaccess", {
  project: googleConfig.project,
  role: "roles/cloudsql.client",
  member: pulumi.interpolate`serviceAccount:${gcpServiceAccount.email}`,
});