import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/migrate']

function getSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
    return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public paths
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    // Allow static files and Next.js internals
    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
        return NextResponse.next()
    }

    const token = request.cookies.get('session')?.value

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        await jwtVerify(token, getSecret())
        return NextResponse.next()
    } catch {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('session')
        return response
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
