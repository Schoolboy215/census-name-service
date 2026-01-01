import { redirect } from 'next/navigation';

export async function GET() {
  // const fileContents = fs.readFileSync(documentationFilePath, 'utf8');
 
  // return new NextResponse(fileContents, {
  //     status: 200,
  //     headers: {
  //       'Content-Type': 'text/html',
  //     },
  //   });
  redirect('/openapi-docs.html');
}