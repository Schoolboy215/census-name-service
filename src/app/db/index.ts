import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon postgres connection string')
}

export const getRandomFirstName = async(_sex : string = "", _yob : number = 0, _state : string = "") => {
  const sql = neon(process.env.DATABASE_URL!);
  const sexToPass   = _sex == "" ? null : _sex;
  const yobToPass   = (Number.isNaN(_yob) == true || _yob == 0) ? null : _yob
  const stateToPass = _state == "" ? null : _state
  const response = await sql('SELECT "CENSUS_NAMES".get_weighted_first_name(_sex => $1, _yob => $2, _state => $3);', [sexToPass, yobToPass, stateToPass]);
  return {firstName : response[0].get_weighted_first_name.toString().toUpperCase()}
}

export const getRandomLastName = async(_race : string = "") => {
  const sql = neon(process.env.DATABASE_URL!);
  const response = await sql('SELECT "CENSUS_NAMES".get_weighted_last_name(_race => $1);', [_race == "" ? null : _race]);
  return {lastName : response[0].get_weighted_last_name.toString().toUpperCase()}
}