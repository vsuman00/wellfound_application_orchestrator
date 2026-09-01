# Workflows

`ci.yml` is the T-001 foundation workflow. It runs locked npm installation, lint,
typecheck, tests, and build on macOS and Windows. T-022 will add dependency,
provenance, license, and secret checks. Workflows never receive live browser sessions,
candidate data, or application databases.
