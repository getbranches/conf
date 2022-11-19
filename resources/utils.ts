import * as gcp from '@pulumi/gcp';
export const nullProvider = new gcp.Provider('google-null-provider', {});
