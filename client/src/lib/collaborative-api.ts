export function getDocumentStatusBadge(status?: string | null) {
  switch (status?.toLowerCase()) {
    case "published":
      return { label: "Published", className: "is-published" };
    case "approved":
      return { label: "Approved", className: "is-approved" };
    case "rejected":
      return { label: "Rejected", className: "is-rejected" };
    case "review":
      return { label: "In Review", className: "is-review" };
    case "draft":
    default:
      return { label: "Draft", className: "is-draft" };
  }
}

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
