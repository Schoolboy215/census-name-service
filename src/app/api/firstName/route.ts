import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getRandomFirstName } from "../../db"; 
 
export async function POST(request: NextRequest)
{
  const headersList = headers();
  const contentType = (await headersList).get("content-type");

  if (contentType?.includes("multipart/form-data") || contentType?.includes("application/x-www-form-urlencoded"))
  {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    if (data.state == null)
    {
      data.state = ""
    }
    if (data.sex == null)
    {
      data.sex = ""
    }
    if (Number(data.yob) < 1910 || Number(data.yob) > 2023)
    {
      return NextResponse.json({error:'yob must be a number between 1910 and 2023, inclusive'}, {status: 400});
    }
    if (Number(data.percentile) < 1 || Number(data.percentile) > 100)
    {
      return NextResponse.json({error:'percentile must be a number between 1 and 100, inclusive'}, {status: 400});
    }
    data.top = String(data.top).toLowerCase()
    if (data.top == null)
    {
      data.top = "true"
    }
    if (data.top != "true" && data.top != "false")
    {
      return NextResponse.json({error:'top must be a string, true or false'}, {status: 400});
    }


    const randomName = await getRandomFirstName(data.sex.toString(), Number(data.yob), data.state.toString(), Number(data.percentile), data.top == "true" ? true : false)
    return NextResponse.json(randomName);
  }
  else
  {
    const randomName = await getRandomFirstName()
    return NextResponse.json(randomName);
  }
}