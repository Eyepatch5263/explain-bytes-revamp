# System Design Flash Docs Migration Record

The source for this migration is the public [Explain Bytes `dev-docs` repository](https://github.com/Eyepatch5263/dev-docs), cloned read-only at `/home/ubuntu/dev-docs-source` for faithful content transfer.

| Source area | Location | Migration requirement |
| --- | --- | --- |
| System Design content | `content/system-design/*.mdx` | Preserve all 25 MDX files (6,200 total lines) and their source frontmatter, prose, code, diagrams, tables, admonitions, and links without trimming. |
| Curated ordering | `content/system-design/_meta.json` and MDX frontmatter | Retain source category and `order` metadata in the reader navigation. |
| MDX renderer | `src/components/mdx-components.tsx` | Register Mermaid, math, tables, code, images, and prose renderers. |
| Chapter simulations | `src/components/simulations/system-design/` | Preserve source DNS, database, and load-balancing simulation experiences, served from each matching chapter route. |
| Listening feature | `src/components/TTSPlayer.tsx` and `src/app/api/tts/route.ts` | Recreate the Amazon Polly generated-MP3 plus S3 cache flow through a secure server-side procedure. The reimplementation uses dedicated `EXPLAINBYTES_AWS_*` variables and requires `EXPLAINBYTES_CHAPTER_AUDIO_ENABLED=true` before calls are permitted. |

The original listener converts the full MDX chapter to speech-safe text, omitting code blocks and diagram markup; it synthesizes MP3 chunks through Amazon Polly, caches a combined MP3 in S3 under `tts/{topic}-{slug}.mp3`, and returns a time-limited signed URL for browser playback.
