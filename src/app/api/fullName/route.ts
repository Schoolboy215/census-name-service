import { NextRequest, NextResponse } from 'next/server';
import { getRandomFirstName, getRandomLastName } from "../../db";
import { parseFilterRequest } from '../parseFilterRequest';
import { fullNameSchema } from '../schemas';

export async function POST(request: NextRequest)
{
  const parsed = await parseFilterRequest(request, fullNameSchema);

  if (parsed.kind === 'error')
  {
    return parsed.response;
  }
  if (parsed.kind === 'empty')
  {
    const [randomFirstNames, randomLastNames] = await Promise.all([
      getRandomFirstName(),
      getRandomLastName()
    ]);
    return NextResponse.json([{firstName: randomFirstNames[0].firstName, lastName: randomLastNames[0].lastName}]);
  }

  const data = parsed.data;
  const top = data.top === undefined ? true : data.top === "true";

  const [randomFirstNames, randomLastNames] = await Promise.all([
    getRandomFirstName(data.sex, data.yob, data.state, data.percentile, top, data.quantity),
    getRandomLastName(data.race, data.percentile, top, data.quantity)
  ]);

  const nameList = randomFirstNames.map((first, i) => ({firstName: first.firstName, lastName: randomLastNames[i].lastName}));
  return NextResponse.json(nameList);
}
