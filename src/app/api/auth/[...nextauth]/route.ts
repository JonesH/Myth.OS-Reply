// NextAuth disabled - using custom JWT authentication instead
// import NextAuth from "next-auth";
// import { authOptions } from "@/lib/auth";

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'NextAuth disabled - using custom JWT authentication',
    message: 'Please use /api/auth/login instead'
  }, { status: 404 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'NextAuth disabled - using custom JWT authentication',
    message: 'Please use /api/auth/login instead'
  }, { status: 404 })
}
