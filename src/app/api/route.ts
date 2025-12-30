import { remark } from 'remark';
import remarkGfm from 'remark-gfm'
import html from 'remark-html';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextResponse } from 'next/server';

export async function GET() {
  const markdownFilePath = path.join(process.cwd(), 'public', 'api_documentation.md');
  const fileContents = fs.readFileSync(markdownFilePath, 'utf8');
 
  const matterResult = matter(fileContents);
 
  const processedContent = await remark()
    .use(html)
    .use(remarkGfm)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();
 
  return new NextResponse(contentHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
}