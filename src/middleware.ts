import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { confirmAPIKey } from './app/db'
 
export async function middleware(request: NextRequest) {
  let validKey : Number = 0;
  let returnMessage: String = '';
  if (process.env.REQUIRE_API_KEYS == "true")
  {
    if (request.headers.get('sec-fetch-site') != 'same-origin')
    {
      validKey = await confirmAPIKey(request, true);
      if (validKey != 1)
      {
        switch (validKey) {
          case 0:
            returnMessage = 'Invalid or missing API key. Email server administrator to request one if you need it.';
            break;
          case 2:
            returnMessage = 'Key used too recently. Wait and try again.';
            break;
        }
        return NextResponse.json(
          { success: false, message: returnMessage},
          { status: 401 }
        )
      }
    }
  }
}
 
export const config = {
  matcher: '/api/:path*',
}