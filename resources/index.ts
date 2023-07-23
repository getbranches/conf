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

import './google/postgres-backup'

// Kubernetes resources
import './kubernetes/procore-abax/deployment';
import './kubernetes/procore-abax/ingress';
import './kubernetes/tripletex-project-reporter/deployment';
import './kubernetes/tripletex-project-reporter/ingress';
import './kubernetes/vaultwarden/deployment';
import './kubernetes/vaultwarden/ingress';
import './kubernetes/unleash/deployment';
import './kubernetes/unleash/ingress';
import './kubernetes/todoist-github/event-handler/deployment';
import './kubernetes/todoist-github/event-handler/ingress';
import './kubernetes/todoist-github/frontend/deployment';
import './kubernetes/todoist-github/frontend/ingress';