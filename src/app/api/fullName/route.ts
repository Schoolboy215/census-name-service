import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getRandomFirstName, getRandomLastName } from "../../db"; 
 
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
    if (data.state == null)
    {
      data.state = ""
    }
    if (data.sex == null)
    {
      data.sex = ""
    }
    if (data.sex != "" && data.sex != "M" && data.sex != "F")
    {
      return NextResponse.json({error:'sex must be one of the following values: [M, F]'}, {status: 400});
    }
    if (data.race.toString() != "")
    {
      if (!["white", "black", "asian", "native", "hispanic"].includes(data.race.toString()))
      {
        return NextResponse.json({error:'race must be one of the following values: [white, black, asian, native, hispanic]'}, {status: 400});
      }
    }
    const randomFirstName = await getRandomFirstName(data.sex.toString(), Number(data.yob), data.state.toString())
    const randomLastName = await getRandomLastName(data.race.toString())
    return NextResponse.json(randomFirstName.firstName + " " + randomLastName.lastName);
  }
  else
  {
    const randomFirstName = await getRandomFirstName()
    const randomLastName = await getRandomLastName()
    return NextResponse.json(randomFirstName.firstName + " " + randomLastName.lastName);
  }
}