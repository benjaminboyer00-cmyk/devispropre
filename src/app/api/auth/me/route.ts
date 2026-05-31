import { getSession } from "@/lib/auth";

/** Vérifie la session cookie — utilisé par la page connexion (retour depuis l'app mail). */
export async function GET() {
  const user = await getSession();
  if (!user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  });
}
