import { NextRequest, NextResponse } from 'next/server';
import { getRandomLastName } from "../../db";
import { parseFilterRequest } from '../parseFilterRequest';
import { lastNameSchema } from '../schemas';

export async function POST(request: NextRequest)
{
  const parsed = await parseFilterRequest(request, lastNameSchema);

  if (parsed.kind === 'error')
  {
    return parsed.response;
  }
  if (parsed.kind === 'empty')
  {
    const randomNames = await getRandomLastName();
    return NextResponse.json(randomNames);
  }

  const data = parsed.data;
  const top = data.top === undefined ? true : data.top === "true";

  const randomNames = await getRandomLastName(data.race, data.percentile, top, data.quantity);
  return NextResponse.json(randomNames);
}
