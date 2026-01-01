import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getRandomLastName } from "../../db";
import { z } from 'zod';
import { lastNameSchema } from '../schemas';
 
export async function POST(request: NextRequest)
{
  const headersList = headers();
  const contentType = (await headersList).get("content-type");
  let   data = null;

  if (contentType?.includes("multipart/form-data") || contentType?.includes("application/x-www-form-urlencoded"))
  {
    const formData = await request.formData();
    data = Object.fromEntries(formData);
  }
  else if (contentType?.includes("application/json"))
  {
    const body = await request.json();
    const result = lastNameSchema.safeParse(body);
    if (!result.success)
    {
      return NextResponse.json(z.treeifyError(result.error), { status: 400 });
    }
    data = lastNameSchema.parse(body);
  }
  else
  {
    const randomName = await getRandomLastName()
    return NextResponse.json(randomName);
  }
  if (data.race == null)
  {
    data.race = ""
  }
  const randomName = await getRandomLastName(data.race.toString(), data.percentile ? Number(data.percentile) : undefined, data.top == "true" ? true : false)
  return NextResponse.json(randomName);
}