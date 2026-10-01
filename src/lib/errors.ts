/** Erreur explicite pour accès inter-tenant (IDOR). */
export class ForbiddenError extends Error {
  constructor(message = "Accès refusé à cette ressource.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Erreur du parcours de signature électronique — message affichable au signataire. */
export class SignatureError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "SignatureError";
  }
}
