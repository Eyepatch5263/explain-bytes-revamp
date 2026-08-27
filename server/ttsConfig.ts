const REQUIRED_TTS_KEYS = [
  "EXPLAINBYTES_CHAPTER_AUDIO_ENABLED",
  "EXPLAINBYTES_AWS_ACCESS_KEY_ID",
  "EXPLAINBYTES_AWS_SECRET_ACCESS_KEY",
  "EXPLAINBYTES_AWS_S3_BUCKET_NAME",
] as const;

const isUsableValue = (value: string | undefined) =>
  Boolean(value && value.trim() && !value.includes("your_") && !value.includes("REPLACE_ME"));

export type TtsConfiguration =
  | {
      configured: true;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      bucketName: string;
    }
  | { configured: false; missing: readonly string[] };

export function getTtsConfiguration(environment: NodeJS.ProcessEnv = process.env): TtsConfiguration {
  const missing = REQUIRED_TTS_KEYS.filter((key) => {
    if (key === "EXPLAINBYTES_CHAPTER_AUDIO_ENABLED") {
      return environment[key]?.trim().toLowerCase() !== "true";
    }
    return !isUsableValue(environment[key]);
  });
  if (missing.length > 0) return { configured: false, missing };

  return {
    configured: true,
    region: environment.EXPLAINBYTES_AWS_REGION?.trim() || "us-east-1",
    accessKeyId: environment.EXPLAINBYTES_AWS_ACCESS_KEY_ID!.trim(),
    secretAccessKey: environment.EXPLAINBYTES_AWS_SECRET_ACCESS_KEY!.trim(),
    bucketName: environment.EXPLAINBYTES_AWS_S3_BUCKET_NAME!.trim(),
  };
}
