/** Erreur explicite pour accès inter-tenant (IDOR). */
export class ForbiddenError extends Error {
  constructor(message = "Accès refusé à cette ressource.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
