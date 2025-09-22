# Development guide

## Dumping indexes for new On-Premise release

1. Add new on-premis version to `./src/config.ts:onpremVersions` array. Update `README.md` accordingly.

2. Export the following environment variables:
    - `MONGO_V1_URI`: MongoDB URI for Codefresh Classic (v1) database
    - `MONGO_V2_URI`: MongoDB URI for Codefresh GitOps (v2) database

3. Run `yarn dump` to dump indexes for both products from the root directory:
    - For Classic, run `yarn dump:classic --path ./indexes/<version>/classic`
    - For GitOps, run `yarn dump:gitops --path ./indexes/<version>/gitops`
