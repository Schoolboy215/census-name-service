import { z } from 'zod';
import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry} from '@asteasolutions/zod-to-openapi';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import {firstNameSchema, firstNameResponse, lastNameSchema, lastNameResponse, fullNameSchema, fullNameResponse} from './schemas.ts';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: 'post',
  path: '/api/firstName',
  description: 'Get a random first name with optional filters for sex, year of birth, and state as well as rarity.',
  summary: 'Get a random first name.',
  request: {
    body: {
      description: 'Optional filters',
      content: {
        'application/json' : {
          schema: firstNameSchema
        },
        'multipart/form-data' : {
          schema: firstNameSchema
        },
        'application/x-www-form-urlencoded' : {
          schema: firstNameSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Object with name information.',
      content: {
        'application/json': {
          schema: firstNameResponse
        }
      },
    }
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/lastName',
  description: 'Get a random last name with optional filters for race and rarity.',
  summary: 'Get a random last name.',
  request: {
    body: {
      description: 'Optional filters',
      content: {
        'application/json' : {
          schema: lastNameSchema
        },
        'multipart/form-data' : {
          schema: lastNameSchema
        },
        'application/x-www-form-urlencoded' : {
          schema: lastNameSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Object with name information.',
      content: {
        'application/json': {
          schema: lastNameResponse
        }
      },
    }
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/fullName',
  description: 'Get a random full name with optional filters for sex, year of birth, state, and race as well as rarity.',
  summary: 'Get a random full name.',
  request: {
    body: {
      description: 'Optional filters',
      content: {
        'application/json' : {
          schema: fullNameSchema
        },
        'multipart/form-data' : {
          schema: fullNameSchema
        },
        'application/x-www-form-urlencoded' : {
          schema: fullNameSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Object with name information.',
      content: {
        'application/json': {
          schema: fullNameResponse
        }
      },
    }
  },
});

function getOpenApiDocumentation() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Census names',
      description: 'API that generates realistic American names from public census bureau and social security administration data',
    }
  });
}

function writeDocumentation() {
  // OpenAPI JSON
  const docs = getOpenApiDocumentation();

  // YAML equivalent
  const fileContent = yaml.stringify(docs);
  const yamlFilePath = path.join(process.cwd(), 'public', 'openapi-docs.yml');
  fs.writeFileSync(yamlFilePath, fileContent, {
    encoding: 'utf-8',
  });
}

writeDocumentation();