import { Config } from "@pulumi/pulumi";

const c = new Config("google");

export const project = c.require("projectId");
export const region = c.require("region");
export const zone = c.require("zone");
