import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { confirmAPIKey, KEY_VALID, KEY_INVALID, KEY_RATE_LIMITED } from './app/db'

export async function middleware(request: NextRequest) {
  let validKey : number = KEY_INVALID;
  let returnMessage: string = '';
  let returnStatus: number = 400;
  if (process.env.REQUIRE_API_KEYS == "true" && request.method == "POST")
  {
    if (request.headers.get('sec-fetch-site') != 'same-origin')
    {
      validKey = await confirmAPIKey(request, true);
      if (validKey != KEY_VALID)
      {
        switch (validKey) {
          case KEY_INVALID:
            returnMessage = 'Invalid or missing API key. Email server administrator to request one if you need it.';
            returnStatus = 401;
            break;
          case KEY_RATE_LIMITED:
            returnMessage = 'Key used too recently. Wait and try again.';
            returnStatus = 429;
            break;
        }
        return NextResponse.json(
          { success: false, message: returnMessage},
          { status: returnStatus }
        )
      }
    }
  }
}
 
export const config = {
  matcher: '/api/:path*',
}