import { Config } from "@pulumi/pulumi";

const c = new Config("github");

export const owner = c.require("owner");
export const token = c.requireSecret("token");
