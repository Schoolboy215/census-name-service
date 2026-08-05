import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { raceList, sexList, boolList, stateList } from './constants.ts';
extendZodWithOpenApi(z);

const firstNameSchema = z.object({
  sex: z.enum(sexList).openapi({ example: 'M' }).optional(),
  yob: z.number().min(1910).max(2023).openapi({ example: 1970 }).optional(),
  state: z.enum(stateList).openapi({ example: 'OK' }).optional(),
  percentile: z.int().min(1).max(100).openapi({description: 'Rarity of the name, paired with top. See "Percentile filtering" above for more information'}).optional(),
  top: z.enum(boolList).openapi({ description: 'true if the percentile should be on the common end, false if it should be on the bottom. See "Percentile filtering" above for more information'}).optional(),
  quantity: z.int().min(1).max(process.env.MAX_NAMES_PER_REQUEST ? Number(process.env.MAX_NAMES_PER_REQUEST) : 1).openapi({ description: "How many names to return. Max value is determined by an environment variable."}).default(1)
});
const firstNameResponse = z.array(
  z.object({
    firstName: z.string().openapi({ example: 'MARK' })
  })
);

const lastNameSchema = z.object({
  race: z.enum(raceList).openapi({ example: 'white' }).optional(),
  percentile: z.int().min(1).max(100).openapi({description: 'Rarity of the name, paired with top. See "Percentile filtering" above for more information'}).optional(),
  top: z.enum(boolList).openapi({ description: 'true if the percentile should be on the common end, false if it should be on the bottom. See "Percentile filtering" above for more information'}).optional(),
  quantity: z.int().min(1).max(process.env.MAX_NAMES_PER_REQUEST ? Number(process.env.MAX_NAMES_PER_REQUEST) : 1).openapi({ description: "How many names to return. Max value is determined by an environment variable."}).default(1)
});
const lastNameResponse = z.array(
  z.object({
    lastName: z.string().openapi({ example: 'SMITH' })
  })
);

// The max value of quantity comes from an environment variable. This is set both in production and github for the pusposes of automatic doc building. Keep these in sync!
const fullNameSchema = z.object({
  sex: z.enum(sexList).openapi({ example: 'M' }).optional(),
  yob: z.number().min(1910).max(2023).openapi({ example: '1970' }).optional(),
  state: z.enum(stateList).openapi({ example: 'OK' }).optional(),
  race: z.enum(raceList).openapi({ example: 'white' }).optional(),
  percentile: z.int().min(1).max(100).openapi({description: 'Rarity of the name, paired with top. See "Percentile filtering" above for more information'}).optional(),
  top: z.enum(boolList).openapi({ description: 'true if the percentile should be on the common end, false if it should be on the bottom. See "Percentile filtering" above for more information'}).optional(),
  quantity: z.int().min(1).max(process.env.MAX_NAMES_PER_REQUEST ? Number(process.env.MAX_NAMES_PER_REQUEST) : 1).openapi({ description: "How many names to return. Max value is determined by an environment variable."}).default(1)
});

const fullNameResponse = z.array(
  z.object({
    firstName: z.string().openapi({ example: 'MARK' }),
    lastName: z.string().openapi({ example: 'SMITH' })
  })
);

const throttledResponse = z.object({
  success: z.literal(false),
  message: z.literal("Key used too recently. Wait and try again.")
});

const missingKeyResponse = z.object({
  success: z.literal(false),
  message: z.literal("Invalid or missing API key. Email server administrator to request one if you need it.")
});

export {firstNameSchema, firstNameResponse, lastNameSchema, lastNameResponse, fullNameSchema, fullNameResponse, throttledResponse, missingKeyResponse};