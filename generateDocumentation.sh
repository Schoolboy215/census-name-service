#!/bin/bash
node ./src/app/api/generateOpenAPI.ts
npx openapi-generate-html -i ./public/openapi-docs.yml -o ./public/openapi-docs.html --ui=stoplight --theme=dark