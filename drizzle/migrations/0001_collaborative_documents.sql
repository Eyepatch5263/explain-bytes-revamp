-- Apply to the existing PostgreSQL database before deploying the collaborative editor.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_subject text;

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_subject_unique
  ON public.users (auth_subject)
  WHERE auth_subject IS NOT NULL;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'mdx',
  ADD COLUMN IF NOT EXISTS ydoc_state bytea,
  ADD COLUMN IF NOT EXISTS forked_from_document_id text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_status_check CHECK (status = ANY (ARRAY['draft'::text, 'review'::text, 'approved'::text, 'rejected'::text, 'published'::text]));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_forked_from_document_id_fkey'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_forked_from_document_id_fkey
      FOREIGN KEY (forked_from_document_id)
      REFERENCES public.documents (document_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS documents_owner_updated_idx
  ON public.documents (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS documents_forked_from_idx
  ON public.documents (forked_from_document_id);
