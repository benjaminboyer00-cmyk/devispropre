import { SITE } from "./seo";

export const LEGAL = {
  editor: {
    name: "Benjamin Boyer",
    company: SITE.name,
    address: "France",
    email: "contact@devispropre.fr",
    phone: SITE.phone,
    phoneRaw: SITE.phoneRaw,
    siret: "En cours d'immatriculation",
  },
} as const;
