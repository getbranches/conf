import * as pulumi from '@pulumi/pulumi';
import * as config from './config';

import './config';
import './google/artifact-registry';
import './google/gke';
import './google/iam';
import './google/postgres-backup';
import './google/project';
import './google/slack-logger';
import './repository-with-artifacts';

// Kubernetes charts and other resources
import './kubernetes/ingress-controller.chart';
import './kubernetes/postgres-operator.chart';
import './kubernetes/provider';

// Kubernetes Deployments
import './kubernetes/deployments/abax-minuba';
import './kubernetes/deployments/abax-procore';
import './kubernetes/deployments/abax-vwfs';
import './kubernetes/todoist-github/deployment';
import './kubernetes/todoist-github/ingress';
import './kubernetes/tripletex-project-reporter/deployment';
import './kubernetes/tripletex-project-reporter/ingress';
import './kubernetes/unleash/deployment';
import './kubernetes/unleash/ingress';
import './kubernetes/vaultwarden/deployment';
import './kubernetes/vaultwarden/ingress';

export const githubToken = pulumi.secret(config.githubToken);
