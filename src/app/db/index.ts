import { neon } from '@neondatabase/serverless';
import type { NextRequest } from 'next/server'

export const getRandomFirstName = async(_sex : string = "", _yob : number = 0, _state : string = "", _percentile : number = 100, _top : boolean = true) => {
  const sql = neon(process.env.DATABASE_URL!);
  const sexToPass         = _sex == "" ? null : _sex;
  const yobToPass         = (Number.isNaN(_yob) == true || _yob == 0) ? null : _yob
  const stateToPass       = _state == "" ? null : _state
  const percentileToPass  = _percentile
  const topToPass         = _top
  const response = await sql('SELECT "CENSUS_NAMES".get_weighted_first_name(_sex => $1, _yob => $2, _state => $3, _percentile => $4, _top => $5);', [sexToPass, yobToPass, stateToPass, percentileToPass, topToPass]);
  return {firstName : response[0].get_weighted_first_name.toString().toUpperCase()}
}

export const getRandomLastName = async(_race : string = "", _percentile : number = 100, _top : boolean = true) => {
  const sql = neon(process.env.DATABASE_URL!);
  const response = await sql('SELECT "CENSUS_NAMES".get_weighted_last_name(_race => $1, _percentile => $2, _top => $3);', [_race == "" ? null : _race, _percentile, _top]);
  return {lastName : response[0].get_weighted_last_name.toString().toUpperCase()}
}

export const confirmAPIKey = async(request: NextRequest, increment: boolean = false) => {
  if (request.headers.get('sec-fetch-site') != 'same-origin')
  {
    if (request.headers.get('x-api-key'))
    {
      const sql = neon(process.env.DATABASE_URL!);
      try
      {
        const response = await sql('SELECT "CENSUS_NAMES".check_api_key(_key => $1, _increment => $2, _secondsAllowed => $3);', [request.headers.get('x-api-key'), increment, process.env.MIN_SECONDS_BETWEEN_REQUESTS]);
        return response[0]['check_api_key'];
      }
      catch
      {
        return 0;
      }
    }
    return 0;
  }
  return 1;
}