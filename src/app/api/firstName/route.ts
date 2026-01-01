import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getRandomFirstName } from "../../db"; 
import { z } from 'zod';
import { firstNameSchema } from '../schemas';
 
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
    const result = firstNameSchema.safeParse(body);
    if (!result.success)
    {
      return NextResponse.json(z.treeifyError(result.error), { status: 400 });
    }
    data = firstNameSchema.parse(body);
  }
  else
  {
    const randomName = await getRandomFirstName()
    return NextResponse.json(randomName);
  }

  if (data.state == null)
  {
    data.state = "";
  }
  if (data.sex == null)
  {
    data.sex = "";
  }
  if (data.top == null)
  {
    data.top = "true";
  }

  const randomName = await getRandomFirstName(data.sex.toString(), Number(data.yob), data.state.toString(), data.percentile ? Number(data.percentile) : undefined, data.top == "true" ? true : false)
  return NextResponse.json(randomName);
}