import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return new Response(`
    <html>
      <body>
        <p>Deprecated: Twitter OAuth is handled by NextAuth.</p>
        <script>window.location.replace('/auth/signin');</script>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' }, status: 410 })
}

