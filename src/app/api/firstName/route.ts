import { NextRequest, NextResponse } from 'next/server';
import { getRandomFirstName } from "../../db";
import { parseFilterRequest } from '../parseFilterRequest';
import { firstNameSchema } from '../schemas';

export async function POST(request: NextRequest)
{
  const parsed = await parseFilterRequest(request, firstNameSchema);

  if (parsed.kind === 'error')
  {
    return parsed.response;
  }
  if (parsed.kind === 'empty')
  {
    const randomNames = await getRandomFirstName();
    return NextResponse.json(randomNames);
  }

  const data = parsed.data;
  const top = data.top === undefined ? true : data.top === "true";

  const randomNames = await getRandomFirstName(data.sex, data.yob, data.state, data.percentile, top, data.quantity);
  return NextResponse.json(randomNames);
}
