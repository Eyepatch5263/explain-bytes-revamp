import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getTtsConfiguration } from "./ttsConfig";
import { systemDesignMdxSource } from "./systemDesignMdx";

export const mdxToPlainText = (mdx: string) => {
  let text = mdx.replace(/^---[\s\S]*?---/, "");
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/<Mermaid\b[\s\S]*?\/>/g, "");
  text = text.replace(/<[A-Z][a-zA-Z0-9]*\b[^>]*\/>/g, "");
  text = text.replace(/<([A-Z][a-zA-Z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/g, "");
  text = text.replace(/<\/?[A-Za-z][a-zA-Z0-9]*\b[^>]*>/g, "");
  text = text.replace(/^\s*\|?[\s\-:|]+\|?\s*$/gm, "");
  text = text.replace(/^\s*\|\s*/gm, "").replace(/\s*\|\s*$/gm, "").replace(/\s*\|\s*/g, ", ");
  text = text.replace(/!\[.*?\]\(.*?\)/g, "");
  text = text.replace(/\[(.*?)\]\(.*?\)/g, "$1");
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2").replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/^#+\s+/gm, "").replace(/^\s*>\s?/gm, "");
  text = text.replace(/^\s*[*\-+]\s+/gm, "").replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, "");
  return text.replace(/\n\s*\n/g, "\n\n").trim();
};

export const splitTextIntoChunks = (text: string, maxChunkSize = 2500) => {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    if (text.length - start <= maxChunkSize) {
      chunks.push(text.slice(start));
      break;
    }
    const sample = text.slice(start, start + maxChunkSize);
    const sentenceEnds = Array.from(sample.matchAll(/[.!?](?:\s|$)/g));
    const sentenceEnd = sentenceEnds.at(-1)?.index;
    const breakAt = sentenceEnd !== undefined ? sentenceEnd + 1 : Math.max(sample.lastIndexOf(" "), maxChunkSize);
    chunks.push(text.slice(start, start + breakAt));
    start += breakAt;
    while (start < text.length && /\s/.test(text[start])) start += 1;
  }
  return chunks.filter(Boolean);
};

export type ChapterAudioResult =
  | { status: "unconfigured"; message: string }
  | { status: "ready"; audioUrl: string; cached: boolean };

export async function getChapterAudio(slug: string): Promise<ChapterAudioResult> {
  const config = getTtsConfiguration();
  if (!config.configured) {
    return { status: "unconfigured", message: "Chapter listening is ready for your AWS Polly and S3 credentials." };
  }

  const mdxContent = systemDesignMdxSource[slug];
  if (!mdxContent) throw new Error("The requested System Design chapter was not found.");
  const plainText = mdxToPlainText(mdxContent);
  if (!plainText) throw new Error("This chapter has no speakable text.");

  const clientOptions = {
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  };
  const s3 = new S3Client(clientOptions);
  const polly = new PollyClient(clientOptions);
  const key = `tts/system-design-${slug}.mp3`;

  try {
    await s3.send(new HeadObjectCommand({ Bucket: config.bucketName, Key: key }));
    const audioUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucketName, Key: key }), { expiresIn: 3600 });
    return { status: "ready", audioUrl, cached: true };
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && (error as { name: string }).name !== "NotFound" && (error as { name: string }).name !== "NotFoundException") throw error;
  }

  const buffers: Buffer[] = [];
  for (const chunk of splitTextIntoChunks(plainText)) {
    const response = await polly.send(new SynthesizeSpeechCommand({ Engine: "generative", OutputFormat: "mp3", Text: chunk, VoiceId: "Stephen" }));
    if (!response.AudioStream) throw new Error("Amazon Polly did not return an audio stream.");
    buffers.push(Buffer.from(await response.AudioStream.transformToByteArray()));
  }
  const body = Buffer.concat(buffers);
  await s3.send(new PutObjectCommand({ Bucket: config.bucketName, Key: key, Body: body, ContentType: "audio/mpeg" }));
  const audioUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucketName, Key: key }), { expiresIn: 3600 });
  return { status: "ready", audioUrl, cached: false };
}
