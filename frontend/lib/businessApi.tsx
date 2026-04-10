import { authFetch } from "./authApi";

export type Categorie = {
  id: string;
  nom: string;
};

export type CreateCategorieDto = {
  nom: string;
};

export type UpdateCategorieDto = {
  nom: string;
};

type ApiErrorShape = {
  message?: string;
  erreur?: string;
  error?: string;
  title?: string;
};

async function readResponseText(res: Response): Promise<string> {
  return res.text().catch(() => "");
}

function extractMessage(rawText: string, fallback: string): string {
  if (!rawText) return fallback;

  try {
    const data = JSON.parse(rawText) as ApiErrorShape;
    return data.message || data.erreur || data.error || data.title || rawText;
  } catch {
    return rawText;
  }
}

export async function getCategories(): Promise<Categorie[]> {
  const res = await authFetch("/business/api/categories");

  const rawText = await readResponseText(res);
  console.log("GET /business/api/categories status =", res.status);
  console.log("GET /business/api/categories body =", rawText);

  if (!res.ok) {
    throw new Error(
      extractMessage(rawText, `Erreur chargement catégories (HTTP ${res.status})`)
    );
  }

  return rawText ? JSON.parse(rawText) : [];
}

export async function createCategorie(dto: CreateCategorieDto): Promise<Categorie> {
  const res = await authFetch("/business/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  const rawText = await readResponseText(res);
  console.log("POST /business/api/categories status =", res.status);
  console.log("POST /business/api/categories body =", rawText);

  if (!res.ok) {
    throw new Error(
      extractMessage(rawText, `Erreur création catégorie (HTTP ${res.status})`)
    );
  }

  return rawText ? JSON.parse(rawText) : ({} as Categorie);
}

export async function updateCategorie(id: string, dto: UpdateCategorieDto): Promise<Categorie> {
  const res = await authFetch(`/business/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  const rawText = await readResponseText(res);
  console.log(`PUT /business/api/categories/${id} status =`, res.status);
  console.log(`PUT /business/api/categories/${id} body =`, rawText);

  if (!res.ok) {
    throw new Error(
      extractMessage(rawText, `Erreur modification catégorie (HTTP ${res.status})`)
    );
  }

  return rawText ? JSON.parse(rawText) : ({} as Categorie);
}

export async function deleteCategorie(id: string): Promise<void> {
  const res = await authFetch(`/business/api/categories/${id}`, {
    method: "DELETE",
  });

  const rawText = await res.text().catch(() => "");
  console.log(`DELETE /business/api/categories/${id} status =`, res.status);
  console.log(`DELETE /business/api/categories/${id} body =`, rawText);

  if (!res.ok) {
    let message = `Erreur suppression catégorie (HTTP ${res.status})`;

    if (rawText) {
      try {
        const data = JSON.parse(rawText) as {
          message?: string;
          erreur?: string;
          error?: string;
          title?: string;
        };

        message =
          data.message ||
          data.erreur ||
          data.error ||
          data.title ||
          rawText;
      } catch {
        message = rawText;
      }
    }

    throw new Error(message);
  }
}
export type TagCulturel = {
  id: string;
  nom: string;
};

export type CreateTagCulturelDto = {
  nom: string;
};

export type UpdateTagCulturelDto = {
  nom: string;
};

export async function getTagsCulturels(): Promise<TagCulturel[]> {
  const res = await authFetch("/business/api/tagsculturels");

  const rawText = await res.text().catch(() => "");
  console.log("GET /business/api/tagsculturels status =", res.status);
  console.log("GET /business/api/tagsculturels body =", rawText);

  if (!res.ok) {
    throw new Error(
      extractMessage(rawText, `Erreur chargement tags culturels (HTTP ${res.status})`)
    );
  }

  return rawText ? JSON.parse(rawText) : [];
}

export async function createTagCulturel(
  dto: CreateTagCulturelDto
): Promise<TagCulturel> {
  const res = await authFetch("/business/api/tagsculturels", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  const rawText = await res.text().catch(() => "");
  console.log("POST /business/api/tagsculturels status =", res.status);
  console.log("POST /business/api/tagsculturels body =", rawText);

  if (!res.ok) {
    throw new Error(
      extractMessage(rawText, `Erreur création tag culturel (HTTP ${res.status})`)
    );
  }

  return rawText ? JSON.parse(rawText) : ({} as TagCulturel);
}

export async function updateTagCulturel(
  id: string,
  dto: UpdateTagCulturelDto
): Promise<TagCulturel> {
  const res = await authFetch(`/business/api/tagsculturels/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  const rawText = await res.text().catch(() => "");
  console.log(`PUT /business/api/tagsculturels/${id} status =`, res.status);
  console.log(`PUT /business/api/tagsculturels/${id} body =`, rawText);

  if (!res.ok) {
    throw new Error(
      extractMessage(rawText, `Erreur modification tag culturel (HTTP ${res.status})`)
    );
  }

  return rawText ? JSON.parse(rawText) : ({} as TagCulturel);
}

export async function deleteTagCulturel(id: string): Promise<void> {
  const res = await authFetch(`/business/api/tagsculturels/${id}`, {
    method: "DELETE",
  });

  const rawText = await res.text().catch(() => "");
  console.log(`DELETE /business/api/tagsculturels/${id} status =`, res.status);
  console.log(`DELETE /business/api/tagsculturels/${id} body =`, rawText);

  if (!res.ok) {
    throw new Error(
      extractMessage(rawText, `Erreur suppression tag culturel (HTTP ${res.status})`)
    );
  }
}