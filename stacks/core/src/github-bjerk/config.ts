import { Config } from "@pulumi/pulumi";

const c = new Config("bjerkio-github");

export const owner = c.require("owner");
export const token = c.requireSecret("token");
