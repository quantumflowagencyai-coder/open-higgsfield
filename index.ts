// Seedance 2.5 text-to-video through the official Higgsfield SDK.
// Run with `pnpm example`; HF_CREDENTIALS is loaded from .env.local at runtime.
import { config, higgsfield } from "@higgsfield/client/v2";

const MODEL = "bytedance/seedance-2.5/text-to-video";

async function main(): Promise<number> {
  if (!process.env.HF_CREDENTIALS) {
    console.error("HF_CREDENTIALS is not set. Add it to .env.local as key-id:key-secret.");
    return 1;
  }

  config({
    credentials: process.env.HF_CREDENTIALS,
    // Video renders can outlast the SDK's 5-minute default.
    maxPollTime: 15 * 60 * 1000,
  });

  console.log(`Submitting ${MODEL}…`);
  const result = await higgsfield.subscribe(MODEL, {
    input: {
      prompt: "A cinematic scene at sunset",
      duration: 5,
      resolution: "720p",
      aspect_ratio: "16:9",
    },
    withPolling: true,
  });

  // The SDK types list five statuses, but the API can also report others
  // (such as "canceled"), so anything but a completed run with a URL fails.
  const status: string = result.status;
  const url = result.video?.url;

  if (status === "completed" && url) {
    console.log(`Completed (request ${result.request_id})`);
    console.log(`Video URL: ${url}`);
    return 0;
  }
  if (status === "nsfw") {
    console.error(`Moderated: the request was blocked by content moderation (request ${result.request_id}).`);
  } else if (status === "failed") {
    console.error(`Failed: generation failed (request ${result.request_id}).`);
  } else if (status === "canceled" || status === "cancelled") {
    console.error(`Canceled: the request was canceled (request ${result.request_id}).`);
  } else if (status === "completed") {
    console.error(`Completed without a video URL (request ${result.request_id}).`);
  } else {
    console.error(`Stopped with unexpected status "${status}" (request ${result.request_id}).`);
  }
  return 1;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    // Print only the name and message: the SDK's HTTP errors carry request
    // config, including the Authorization header, which must never be logged.
    const name = error instanceof Error ? error.name : "Error";
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${name}: ${message}`);
    process.exit(1);
  },
);
