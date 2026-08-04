import { z } from 'zod';
import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry} from '@asteasolutions/zod-to-openapi';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import {firstNameSchema, firstNameResponse, lastNameSchema, lastNameResponse, fullNameSchema, fullNameResponse, throttledResponse, missingKeyResponse} from './schemas.ts';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
  type: 'apiKey',
  in: "header",
  name: "x-api-key",
  description: "Only required if the server is configured with REQUIRE_API_KEYS=true. Doesn't apply to same-origin requests from the site."
});

registry.registerPath({
  method: 'post',
  path: '/api/firstName',
  description: 'Get a random first name with optional filters for sex, year of birth, and state as well as rarity.',
  summary: 'Get a random first name.',
  security: [{ ApiKeyAuth: [] }, {}],
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
    },
    401: {
      description: 'Missing API key',
      content: {
        'application/json' : {
          schema: missingKeyResponse
        }
      }
    },
    429: {
      description: 'Throttled for using API key too recently.',
      content: {
        'application/json' : {
          schema: throttledResponse
        }
      }
    }
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/lastName',
  description: 'Get a random last name with optional filters for race and rarity.',
  summary: 'Get a random last name.',
  security: [{ ApiKeyAuth: [] }, {}],
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
    },
    401: {
      description: 'Missing API key',
      content: {
        'application/json' : {
          schema: missingKeyResponse
        }
      }
    },
    429: {
      description: 'Throttled for using API key too recently.',
      content: {
        'application/json' : {
          schema: throttledResponse
        }
      }
    }
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/fullName',
  description: 'Get a random full name with optional filters for sex, year of birth, state, and race as well as rarity.',
  summary: 'Get a random full name.',
  security: [{ ApiKeyAuth: [] }, {}],
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
      description: 'Object with name information. Note that results are returned in an array even if there is only one element',
      content: {
        'application/json': {
          schema: fullNameResponse
        }
      },
    },
    401: {
      description: 'Missing API key',
      content: {
        'application/json' : {
          schema: missingKeyResponse
        }
      }
    },
    429: {
      description: 'Throttled for using API key too recently.',
      content: {
        'application/json' : {
          schema: throttledResponse
        }
      }
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
      description: `
      API that generates realistic American names from public census bureau and social security administration data

      ## Percentile filtering
      Percentile represents how much of the distribution to use, and top represents whether this distribution is at the most common end (true) or least common end (false). To put it into simple terms with an example, requesting top="true", percentile=20 is equivalent to asking for a name that is in the top 20% most common names.
      `.replace(/^[ \t]+/gm, '')
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