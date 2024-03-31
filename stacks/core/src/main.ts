import "./google/artifact-registry";
import "./google/identity-pool-github.ts";
import "./github/organization-secrets";
import "./google/gke";
import "./google/database";
import "./kubernetes/ingress-controller.chart";
import { kubeconfig } from "./kubeconfig";

export {
  kubeconfig,
};