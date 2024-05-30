# Branches Infrastructure Repository

This repository contains the infrastructure code for Branches.

## Deploying manually

With a sufficiently powerful account, authenticate with Google Cloud normally
and as application-default:

```sh
gcloud auth login
```

```sh
gcloud auth application-default login
```

Then you can run pulumi locally:

```sh
pulumi up
```

> **Note:** In order to deploy an individual stack in the `stacks` folder, you
> must first navigate to that stack's folder, e.g `cd stacks/abax-minuba`
