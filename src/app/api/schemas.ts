import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { raceList, sexList, boolList, stateList } from './constants.ts';
extendZodWithOpenApi(z);

const firstNameSchema = z.object({
  sex: z.enum(sexList).openapi({ example: 'M' }).optional(),
  yob: z.number().min(1910).max(2023).openapi({ example: 1970 }).optional(),
  state: z.enum(stateList).openapi({ example: 'OK' }).optional(),
  percentile: z.int().min(1).max(100).optional(),
  top: z.enum(boolList).optional()
});
const firstNameResponse = z.object({
  firstName: z.string().openapi({ example: 'MARK' })
});

const lastNameSchema = z.object({
  race: z.enum(raceList).openapi({ example: 'white' }).optional(),
  percentile: z.int().min(1).max(100).optional(),
  top: z.enum(boolList).optional()
});
const lastNameResponse = z.object({
  lastName: z.string().openapi({ example: 'SMITH' })
});

const fullNameSchema = z.object({
  sex: z.enum(sexList).openapi({ example: 'M' }).optional(),
  yob: z.number().min(1910).max(2023).openapi({ example: '1970' }).optional(),
  state: z.enum(stateList).openapi({ example: 'OK' }).optional(),
  race: z.enum(raceList).openapi({ example: 'white' }).optional(),
  percentile: z.int().min(1).max(100).optional(),
  top: z.enum(boolList).optional()
});
const fullNameResponse = z.object({
  firstName: z.string().openapi({ example: 'MARK' }),
  lastName: z.string().openapi({ example: 'SMITH' })
});

export {firstNameSchema, firstNameResponse, lastNameSchema, lastNameResponse, fullNameSchema, fullNameResponse};