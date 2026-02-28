
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname === '/login';
            const isPublic = isOnLogin || nextUrl.pathname.startsWith('/api/auth');

            if (isPublic) {
                // If logged in and trying to access login, redirect to dashboard
                if (isOnLogin && isLoggedIn) {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            // Everything else requires login
            if (!isLoggedIn) {
                return false; // Redirects to signIn page (/login)
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                // @ts-ignore
                session.user.role = token.role;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                // @ts-ignore
                token.role = user.role;
            }
            return token;
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
