import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req, secret });

  if (!token || !token.sub)
    return res.send({
      error: "User wallet not authenticated",
    });

  if (token) {
    return res.send({
      content:
        "This is protected content. You can access this content because you are signed in with your Solana Wallet.",
    });
  }

  res.send({
    error: "You must be signed in with your Solana Wallet to view the protected content on this page.",
  });
}