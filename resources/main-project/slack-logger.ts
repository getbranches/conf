import * as gcp from '@pulumi/gcp';
import * as pulumi from '@pulumi/pulumi';
import { project } from './main-project';

const config = new pulumi.Config('slack');
const name = 'branches-slack-logger';
const slackAgentTag = 'v3.1.0';

const topic = new gcp.pubsub.Topic(name, {}, { parent: this });

const serviceAccount = new gcp.serviceaccount.Account(
  name,
  {
    accountId: name,
  },
  { parent: this },
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
              value: args.channel,
            },
          ],
        },
      ],
    },
  },
  { parent: this },
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
  { parent: this },
);

new gcp.projects.IAMMember(
  name,
  {
    project: project.projectId,
    role: 'roles/eventarc.eventReceiver',
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
  },
  { parent: this },
);

new gcp.cloudrunv2.ServiceIamMember(
  name,
  {
    name: service.name,
    location: 'europe-west1',
    role: 'roles/run.invoker',
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
  },
  { parent: this },
);

const logSink = new gcp.logging.ProjectSink(
  name,
  {
    name,
    filter:
      'operation.producer="github.com/bjerkio/google-cloud-logger-slack@v1"',
    destination: pulumi.interpolate`pubsub.googleapis.com/${topic.id}`,
  },
  { protect: true, parent: this },
);

new gcp.pubsub.TopicIAMMember(
  name,
  {
    topic: topic.name,
    role: 'roles/pubsub.publisher',
    member: logSink.writerIdentity,
  },
  { protect: true, parent: this },
);
