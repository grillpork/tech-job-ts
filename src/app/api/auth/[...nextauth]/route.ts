import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * @swagger
 * /api/auth/{nextauth}:
 *   post:
 *     summary: NextAuth operations
 *     tags: [Auth]
 *     description: Handles authentication operations (login, logout, session)
 *     responses:
 *       200:
 *         description: Success
 *   get:
 *     summary: NextAuth operations
 *     tags: [Auth]
 *     description: Handles session checks and callbacks
 *     responses:
 *       200:
 *         description: Success
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
