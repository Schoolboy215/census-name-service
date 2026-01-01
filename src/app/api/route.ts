import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET() {
  // const documentationFilePath = path.join(process.cwd(), 'public', 'openapi-docs.html');
  // const fileContents = fs.readFileSync(documentationFilePath, 'utf8');
 
  // return new NextResponse(fileContents, {
  //     status: 200,
  //     headers: {
  //       'Content-Type': 'text/html',
  //     },
  //   });
  redirect('/openapi-docs.html');
}