import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Every /api/* route accepts optional filters via JSON body, multipart/form-data,
// x-www-form-urlencoded, or URL query parameters. This centralizes figuring out
// which of those a given request used, validating it against that route's Zod
// schema, and rejecting requests that supplied data we can't make sense of
// instead of silently ignoring it.
type ParsedFilterRequest<T> =
  | { kind: 'data'; data: T }
  | { kind: 'empty' } // No filters anywhere - caller should fall back to a fully random result.
  | { kind: 'error'; response: NextResponse };

function omitEmptyStrings(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== ''));
}

export async function parseFilterRequest<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<ParsedFilterRequest<z.infer<T>>> {
  const contentType = request.headers.get('content-type');
  const searchParams = request.nextUrl.searchParams;

  let raw: Record<string, unknown> | null = null;

  if (contentType?.includes('multipart/form-data') || contentType?.includes('application/x-www-form-urlencoded'))
  {
    // HTML forms submit every field, including untouched <select>s and empty
    // number inputs, as an empty string - that means "not provided" here,
    // not "explicitly set to an empty value", so drop those before validating.
    raw = omitEmptyStrings(Object.fromEntries(await request.formData()));
  }
  else if (contentType?.includes('application/json'))
  {
    raw = await request.json();
  }
  else if ([...searchParams].length > 0)
  {
    raw = omitEmptyStrings(Object.fromEntries(searchParams));
  }
  else
  {
    // No recognized content-type and no query params. Distinguish a genuinely
    // empty request (no filters were ever supplied - fine, use defaults) from
    // one carrying a body we don't know how to parse (a mistake worth
    // surfacing rather than silently discarding).
    const bodyText = await request.text();
    if (bodyText.trim().length === 0)
    {
      return { kind: 'empty' };
    }
    return {
      kind: 'error',
      response: NextResponse.json(
        {
          success: false,
          message: 'Unsupported or missing Content-Type header. Send application/json, multipart/form-data, or application/x-www-form-urlencoded, or pass filters as URL query parameters.'
        },
        { status: 415 }
      )
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success)
  {
    return { kind: 'error', response: NextResponse.json(z.treeifyError(result.error), { status: 400 }) };
  }
  return { kind: 'data', data: result.data };
}
