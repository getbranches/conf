import './config';
import './google/artifact-registry';
import './google/project';
import './google/gke';
import './google/iam';
import './domain/procore-abax';
import './domain/tripletex-project-reporter';
// import './kubernetes/adminer';
import './google/slack-logger';

import './kubernetes/ingress-controller';
import './kubernetes/postgres-operator';
import './kubernetes/provider';

// Kubernetes resources
import './kubernetes/procore-abax/deployment';
import './kubernetes/procore-abax/ingress';
import './kubernetes/tripletex-project-reporter/deployment';
import './kubernetes/tripletex-project-reporter/ingress';
import './kubernetes/vaultwarden/deployment';
import './kubernetes/vaultwarden/ingress';
import './kubernetes/unleash/deployment';
import './kubernetes/unleash/ingress';
