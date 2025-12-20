import { z } from 'zod';
import { raceList, sexList, boolList, stateList } from './constants';

export const schema = z.object({
  race: z.string().optional(),
  state: z.string().optional(),
  sex: z.string().optional(),
  yob: z.number().min(1910).max(2023).optional(),
  percentile: z.number().min(1).max(100).optional(),
  top: z.string().optional()
}).refine((obj) => {
    if (obj.race !== undefined)
    {
      if (!raceList.includes(obj.race))
      {
        return false;
      }
    }
    return true;
  }, {
    message: `race must be one of the following (${raceList})`
}).refine((obj) => {
    if (obj.sex !== undefined)
    {
      if (!sexList.includes(obj.sex))
      {
        return false;
      }
    }
    return true;
  }, {
    message: `sex must be one of the following (${sexList})`
}).refine((obj) => {
    if (obj.state !== undefined)
    {
      if (!stateList.includes(obj.state))
      {
        return false;
      }
    }
    return true;
  }, {
    message: `state must be one of the following (${stateList})`
}).refine((obj) => {
    if (obj.top !== undefined)
    {
      if (!boolList.includes(obj.top))
      {
        return false;
      }
    }
    return true;
  }, {
    message: `top must be one of the following (${boolList})`
});