import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as config from "./config";
import { Api } from "@pulumi/gcp/apigateway";

export const cluster = new gcp.container.Cluster("primary", {
  name: "branches",
  location: config.region,
  removeDefaultNodePool: true,
  initialNodeCount: 1,

  workloadIdentityConfig: {
    workloadPool: pulumi.interpolate`${config.project}.svc.id.goog`,
  },
});

new gcp.container.NodePool("primary", {
  cluster: cluster.name,
  location: config.region,
  nodeCount: 1,
  management: {
    autoRepair: true,
    autoUpgrade: true,
  },

  nodeConfig: {
    oauthScopes: [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ],
    preemptible: true,
    machineType: "e2-standard-2",
    workloadMetadataConfig: {
      mode: "GKE_METADATA",
    }
  },
});