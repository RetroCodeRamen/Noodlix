
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Validate the URL format to prevent potential SSRF or malformed requests
    let validatedUrl;
    try {
      validatedUrl = new URL(targetUrl);
    } catch (_) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Restrict to http and https protocols
    if (validatedUrl.protocol !== 'http:' && validatedUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'Only http and https protocols are allowed' }, { status: 400 });
    }
    
    const response = await fetch(validatedUrl.toString(), {
      headers: {
        'User-Agent': 'Noodlix-NoodlBrowse/1.0', // Custom user agent
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow', // Follow redirects
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.toLowerCase().includes('text/html')) {
      // For now, only process HTML. Could be extended later.
      // We still return the content, but the client-side parser might struggle.
      // This allows fetching non-HTML text resources if desired.
      console.warn(`Proxy: Fetched non-HTML content-type (${contentType}) from ${targetUrl}`);
    }

    const html = await response.text();
    return NextResponse.json({ html });

  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    console.error(`Proxy error for ${targetUrl}: ${message}`);
    return NextResponse.json({ error: `Error fetching URL: ${message}` }, { status: 500 });
  }
}
