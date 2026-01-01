import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getRandomFirstName, getRandomLastName } from "../../db";
import { z } from 'zod';
import { fullNameSchema } from '../schemas';
 
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
    const result = fullNameSchema.safeParse(body);
    if (!result.success)
    {
      return NextResponse.json(z.treeifyError(result.error), { status: 400 });
    }
    data = fullNameSchema.parse(body);
  }
  else
  {
    const [randomFirstName, randomLastName] = await Promise.all([
      await getRandomFirstName(),
      await getRandomLastName()
    ]);
    return NextResponse.json({firstName : randomFirstName.firstName, lastName : randomLastName.lastName});
  }

  if (data.race == null)
  {
    data.race = ""
  }
  if (data.state == null)
  {
    data.state = ""
  }
  if (data.sex == null)
  {
    data.sex = ""
  }
  data.top = String(data.top).toLowerCase()
  if (data.top == null)
  {
    data.top = "true"
  }

  const [randomFirstName, randomLastName] = await Promise.all([
    await getRandomFirstName(data.sex.toString(), Number(data.yob), data.state.toString(), data.percentile ? Number(data.percentile) : undefined, data.top == "true" ? true : false),
    await getRandomLastName(data.race.toString(), data.percentile ? Number(data.percentile) : undefined, data.top == "true" ? true : false)
  ]);
  return NextResponse.json({firstName : randomFirstName.firstName, lastName : randomLastName.lastName});
}