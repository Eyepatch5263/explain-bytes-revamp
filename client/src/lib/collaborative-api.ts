export type CollaborativeDocument = {
  id: string;
  title: string;
  category: string;
  section: string;
  content: string;
  format: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  ownerId: string;
  isOwner: boolean;
  forkedFromDocumentId: string | null;
};

export async function collaborativeRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/collaborative${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status}).`);
  }
  return payload as T;
}
