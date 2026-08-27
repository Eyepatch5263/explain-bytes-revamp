import { describe, expect, it } from "vitest";
import { getTtsConfiguration } from "./ttsConfig";

describe("Amazon Polly chapter-listening configuration", () => {
  it("keeps the listener disabled until all registered AWS variables contain usable values", () => {
    expect(getTtsConfiguration({ EXPLAINBYTES_AWS_REGION: "us-east-1" })).toEqual({
      configured: false,
      missing: ["EXPLAINBYTES_CHAPTER_AUDIO_ENABLED", "EXPLAINBYTES_AWS_ACCESS_KEY_ID", "EXPLAINBYTES_AWS_SECRET_ACCESS_KEY", "EXPLAINBYTES_AWS_S3_BUCKET_NAME"],
    });
  });

  it("accepts the complete registered environment contract for the later Polly connectivity check", () => {
    expect(getTtsConfiguration({
      EXPLAINBYTES_CHAPTER_AUDIO_ENABLED: "true",
      EXPLAINBYTES_AWS_REGION: "ap-south-1",
      EXPLAINBYTES_AWS_ACCESS_KEY_ID: "access-key",
      EXPLAINBYTES_AWS_SECRET_ACCESS_KEY: "secret-key",
      EXPLAINBYTES_AWS_S3_BUCKET_NAME: "chapter-audio",
    })).toMatchObject({
      configured: true,
      region: "ap-south-1",
      bucketName: "chapter-audio",
    });
  });
});
