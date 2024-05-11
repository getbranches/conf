import * as gcp from '@pulumi/gcp';
import * as googleConfig from './config';
import { developersIamMembers } from '../config';

developersIamMembers.map(member => {
  [
    // container developer
    new gcp.projects.IAMMember(`container.developer-${member}`, {
      project: googleConfig.project,
      member,
      role: 'roles/container.developer',
    }),

    // cloud sql
    new gcp.projects.IAMMember(`cloudsql.client-${member}`, {
      project: googleConfig.project,
      member,
      role: 'roles/cloudsql.client',
    }),

    // cloud build roles
    new gcp.projects.IAMMember(`cloudbuild.builds.editor-${member}`, {
      project: googleConfig.project,
      member,
      role: 'roles/cloudbuild.builds.editor',
    }),

    // cloud dns roles
    new gcp.projects.IAMMember(`dns.admin-${member}`, {
      project: googleConfig.project,
      member,
      role: 'roles/dns.admin',
    }),

  ];
});