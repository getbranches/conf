import * as pulumi from "@pulumi/pulumi";

const c = new pulumi.Config("operational");

export const email = c.require("email");
export const developersIamMembers = c.requireObject<string[]>("developersIamMembers");