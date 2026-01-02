#!/bin/bash
node ./src/app/api/generateOpenAPI.ts
npx @redocly/cli@latest build-docs ./public/openapi-docs.yml --output=./public/openapi-docs.html