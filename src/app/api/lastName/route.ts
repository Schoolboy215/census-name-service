import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getRandomLastName } from "../../db"; 
 
export async function POST(request: NextRequest)
{
  const headersList = headers();
  const contentType = (await headersList).get("content-type");

  if (contentType?.includes("multipart/form-data") || contentType?.includes("application/x-www-form-urlencoded"))
  {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    if (data.race == null)
    {
      data.race = ""
    }
    if (data.race.toString() != "")
    {
      if (!["white", "black", "asian", "native", "hispanic"].includes(data.race.toString()))
      {
        return NextResponse.json({error:'race must be one of the following values: [white, black, asian, native, hispanic]'}, {status: 400});
      }
    }
    const randomName = await getRandomLastName(data.race.toString())
    return NextResponse.json(randomName);
  }
  else
  {
    const randomName = await getRandomLastName()
    return NextResponse.json(randomName);
  }
}