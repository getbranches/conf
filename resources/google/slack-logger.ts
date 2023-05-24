import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { mainClassicProvider, project } from './project';

const config = new pulumi.Config('slack');
const name = 'branches-slack-logger';
const slackAgentTag = 'v3.1.0';
const channel = 'C0574QRTMCN'; // #branches-notifications

const topic = new gcp.pubsub.Topic(name, {}, { provider: mainClassicProvider });

const serviceAccount = new gcp.serviceaccount.Account(
  name,
  {
    accountId: name,
  },
  { provider: mainClassicProvider },
);

const service = new gcp.cloudrunv2.Service(
  name,
  {
    name: `slack-logger-${name}`,
    location: 'europe-west1',
    description: `Slack logger – ${name}`,
    template: {
      serviceAccount: serviceAccount.email,
      containers: [
        {
          image: `docker.io/bjerkbot/google-cloud-logger-slack:${slackAgentTag}`,
          envs: [
            {
              name: 'SLACK_TOKEN',
              value: config.requireSecret('bot-oauth-token'),
            },
            {
              name: 'DEFAULT_CHANNEL',
              value: channel,
            },
          ],
        },
      ],
    },
  },
  { provider: mainClassicProvider },
);

new gcp.eventarc.Trigger(
  name,
  {
    location: 'europe-west1',
    transports: [
      {
        pubsubs: [
          {
            topic: topic.name,
          },
        ],
      },
    ],
    matchingCriterias: [
      {
        attribute: 'type',
        value: 'google.cloud.pubsub.topic.v1.messagePublished',
      },
    ],
    serviceAccount: serviceAccount.email,
    destination: {
      cloudRunService: {
        service: service.name,
        region: 'europe-west1',
      },
    },
  },
  { provider: mainClassicProvider },
);

new gcp.projects.IAMMember(
  name,
  {
    project: project.projectId,
    role: 'roles/eventarc.eventReceiver',
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
  },
  { provider: mainClassicProvider },
);

new gcp.cloudrunv2.ServiceIamMember(
  name,
  {
    name: service.name,
    location: 'europe-west1',
    role: 'roles/run.invoker',
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
  },
  { provider: mainClassicProvider },
);

const logSink = new gcp.logging.ProjectSink(
  name,
  {
    name,
    filter:
      'operation.producer="github.com/bjerkio/google-cloud-logger-slack@v1"',
    destination: pulumi.interpolate`pubsub.googleapis.com/${topic.id}`,
  },
  { protect: true, provider: mainClassicProvider },
);

new gcp.pubsub.TopicIAMMember(
  name,
  {
    topic: topic.name,
    role: 'roles/pubsub.publisher',
    member: logSink.writerIdentity,
  },
  { protect: true, provider: mainClassicProvider },
);
