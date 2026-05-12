import { generateImage, experimental_generateVideo as generateVideo } from "ai";
import type {
  Admissibility,
  RenderOutputKind,
  RuntimeAdmissibilityReport,
  RuntimeRenderJob,
  RuntimeState,
} from "./types";

export type RenderExecutionRequest = {
  job: RuntimeRenderJob;
  outputKind: RenderOutputKind;
  state: RuntimeState;
};

export type RenderExecutionResult = {
  status: "completed" | "failed" | "blocked";
  provider: string;
  providerJobId: string | null;
  artifactType: RenderOutputKind;
  artifactUrl: string | null;
  mimeType: string | null;
  metadata: Record<string, unknown>;
  error: string | null;
};

type GatewayImage = {
  type?: string;
  image_url?: { url?: string };
  url?: string;
  b64_json?: string;
  base64?: string;
};

type GatewayCompletionResponse = {
  id?: string;
  model?: string;
  usage?: unknown;
  providerMetadata?: unknown;
  choices?: Array<{ message?: { content?: unknown; images?: GatewayImage[] } }>;
  images?: GatewayImage[];
  error?: { message?: string; type?: string; code?: string };
};

const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

type VideoAspectRatio = `${number}:${number}`;
type VideoResolution = `${number}x${number}`;

function getVideoAspectRatio(): VideoAspectRatio {
  const raw = process.env.SOLACEFRAME_VIDEO_ASPECT_RATIO || "16:9";
  return /^\d+:\d+$/.test(raw) ? (raw as VideoAspectRatio) : "16:9";
}

function getVideoResolution(): VideoResolution {
  const raw = process.env.SOLACEFRAME_VIDEO_RESOLUTION || "1280x720";
  return /^\d+x\d+$/.test(raw) ? (raw as VideoResolution) : "1280x720";
}

function decisionAllowsExecution(decision: Admissibility) {
  return decision === "allow" || decision === "conditional";
}

export function buildExecutionPacket(
  job: RuntimeRenderJob,
  state: RuntimeState,
  outputKind: RenderOutputKind,
) {
  const unresolvedContradictions = state.contradictions.filter(
    (item) => !item.resolved,
  );
  const activeCharacters = state.characters.map((character) => ({
    id: character.id,
    name: character.name,
    role: character.role,
    appearanceAnchor: character.appearance_anchor,
    runtimeState: character.state,
    continuityScore: character.continuity_score,
    pressure: character.pressure,
  }));

  return {
    version: "v18.3-live-video-provider-execution-packet",
    outputKind,
    renderJobId: job.id,
    sceneId: job.scene_id,
    branchId: job.branch_id,
    prompt: job.prompt,
    compiledPacket: job.packet,
    governance: {
      admissibility: state.admissibilityReport,
      unresolvedContradictions: unresolvedContradictions.map((item) => ({
        id: item.id,
        type: item.contradiction_type,
        summary: item.summary,
        severity: item.severity,
      })),
    },
    continuity: {
      project: state.project,
      world: state.world,
      activeBranch: state.activeBranch,
      characters: activeCharacters,
      latestContinuityDiff: state.continuityDiffs[0] ?? null,
      causalEvents: state.causalEvents.slice(0, 30),
      visualAnchors: buildVisualContinuityAnchors(state),
    },
    rendering: buildRenderInstructions(
      outputKind,
      job.prompt,
      state.admissibilityReport,
    ),
  };
}

function buildVisualContinuityAnchors(state: RuntimeState) {
  const mediaArtifacts = state.artifacts.filter((artifact) =>
    Boolean(artifact.public_url) &&
    (artifact.mime_type?.startsWith("image/") || artifact.mime_type?.startsWith("video/")),
  );

  const approvedAnchors = mediaArtifacts.filter((artifact) => {
    const v19 = artifact.metadata?.v19 as Record<string, unknown> | undefined;
    return v19?.continuityAnchor === true;
  });

  const primaryAnchor = approvedAnchors[0] ?? mediaArtifacts[0] ?? null;

  return {
    primary: primaryAnchor
      ? {
          artifactId: primaryAnchor.id,
          artifactType: primaryAnchor.artifact_type,
          publicUrl: primaryAnchor.public_url,
          mimeType: primaryAnchor.mime_type,
          provider: primaryAnchor.provider,
          createdAt: primaryAnchor.created_at,
          lockStatus: approvedAnchors[0] ? "operator-approved" : "latest-media-fallback",
          metadata: primaryAnchor.metadata,
        }
      : null,
    approved: approvedAnchors.slice(0, 8).map((artifact) => ({
      artifactId: artifact.id,
      artifactType: artifact.artifact_type,
      publicUrl: artifact.public_url,
      mimeType: artifact.mime_type,
      provider: artifact.provider,
      createdAt: artifact.created_at,
      metadata: artifact.metadata,
    })),
    recentMedia: mediaArtifacts.slice(0, 8).map((artifact) => ({
      artifactId: artifact.id,
      artifactType: artifact.artifact_type,
      publicUrl: artifact.public_url,
      mimeType: artifact.mime_type,
      provider: artifact.provider,
      createdAt: artifact.created_at,
    })),
  };
}

function getPrimaryVisualAnchor(packet: Record<string, unknown>) {
  const continuity = packet.continuity as Record<string, unknown> | undefined;
  const visualAnchors = continuity?.visualAnchors as Record<string, unknown> | undefined;
  const primary = visualAnchors?.primary as Record<string, unknown> | null | undefined;
  if (!primary) return null;
  const publicUrl = stringValue(primary.publicUrl);
  if (!publicUrl) return null;
  return {
    artifactId: stringValue(primary.artifactId),
    artifactType: stringValue(primary.artifactType),
    publicUrl,
    mimeType: stringValue(primary.mimeType),
    lockStatus: stringValue(primary.lockStatus),
  };
}

function estimateArtifactContinuityScore(packet: Record<string, unknown>, outputKind: RenderOutputKind) {
  const continuity = packet.continuity as Record<string, unknown> | undefined;
  const world = continuity?.world as { state?: Record<string, unknown>; pressure?: number } | undefined;
  const branch = continuity?.activeBranch as { divergence_score?: number } | undefined;
  const characters = Array.isArray(continuity?.characters) ? continuity.characters : [];
  const visualAnchor = getPrimaryVisualAnchor(packet);
  const renderConstraints = Array.isArray(world?.state?.renderConstraints)
    ? world?.state?.renderConstraints.length
    : 0;
  const averageCharacterContinuity = characters.length
    ? characters.reduce((sum, item) => {
        const record = item as Record<string, unknown>;
        const score = typeof record.continuityScore === "number" ? record.continuityScore : 80;
        return sum + score;
      }, 0) / characters.length
    : 80;

  let score = Math.round(averageCharacterContinuity);
  if (visualAnchor) score += 10;
  if (outputKind === "video" && visualAnchor) score += 5;
  if (renderConstraints >= 4) score += 4;
  score -= Math.round((world?.pressure ?? 0) / 10);
  score -= Math.round((branch?.divergence_score ?? 0) / 10);
  return Math.max(0, Math.min(100, score));
}

function buildContinuityLockMetadata(packet: Record<string, unknown>, outputKind: RenderOutputKind) {
  const visualAnchor = getPrimaryVisualAnchor(packet);
  return {
    version: "v19-continuity-lock",
    visualAnchorUsed: Boolean(visualAnchor),
    visualAnchor,
    continuityScore: estimateArtifactContinuityScore(packet, outputKind),
    lockMode:
      outputKind === "video" && visualAnchor
        ? "image-to-video-reference-frame"
        : visualAnchor
          ? "reference-informed-render"
          : "textual-runtime-only",
    driftChecks: [
      "character identity",
      "wardrobe silhouette",
      "yellow courier case",
      "left-arm injury visibility",
      "damaged bridge/location continuity",
      "rain/cold lighting continuity",
    ],
  };
}

function buildRenderInstructions(
  outputKind: RenderOutputKind,
  prompt: string,
  report: RuntimeAdmissibilityReport,
) {
  const base = [
    "Render only the governed runtime state provided in the packet.",
    "Preserve character identity, appearance anchors, carried objects, injuries, environment damage, and branch context.",
    "Do not repair contradictions implicitly; render unresolved contradictions as visible tension or defer execution if required.",
    "Maintain causal lineage and avoid introducing unsupported objects, locations, or authority changes.",
    `Runtime admissibility decision: ${report.decision}. Survivability score: ${report.score}%.`,
  ];

  if (outputKind === "video") {
    return {
      mode: "temporal-video",
      durationSeconds: 5,
      frames: 24,
      instructions: [
        ...base,
        "Use a single continuous shot unless the packet explicitly permits a transition.",
        "Preserve camera direction and object positions across the clip.",
      ],
      prompt,
    };
  }

  if (outputKind === "storyboard") {
    return {
      mode: "multi-frame-storyboard",
      frames: 4,
      instructions: [
        ...base,
        "Return a cinematic four-panel storyboard as one image grid.",
        "Each panel must be a continuity checkpoint from the same governed branch, not an unrelated scene.",
      ],
      prompt,
    };
  }

  return { mode: "single-image", instructions: base, prompt };
}

export async function executeRenderRequest({
  job,
  outputKind,
  state,
}: RenderExecutionRequest): Promise<RenderExecutionResult> {
  if (!decisionAllowsExecution(state.admissibilityReport.decision)) {
    return {
      status: "blocked",
      provider: "solaceframe-admissibility-gate",
      providerJobId: null,
      artifactType: outputKind,
      artifactUrl: null,
      mimeType: null,
      metadata: {
        reason: "Runtime admissibility blocked execution.",
        report: state.admissibilityReport,
      },
      error: "Runtime admissibility blocked render execution.",
    };
  }

  const packet = buildExecutionPacket(job, state, outputKind);
  const webhookUrl = process.env.SOLACEFRAME_RENDER_WEBHOOK_URL;

  if (webhookUrl) return executeWebhookRender(webhookUrl, packet, outputKind);

  if (shouldUseVercelGateway(outputKind)) {
    const gatewayResult =
      outputKind === "video"
        ? await executeVercelGatewayVideoRender(packet)
        : await executeVercelGatewayRender(packet, outputKind);
    if (gatewayResult.status === "completed") return gatewayResult;
    if (process.env.SOLACEFRAME_DISABLE_PLACEHOLDER_FALLBACK === "true")
      return gatewayResult;

    const placeholder = executeLocalPlaceholder(packet, outputKind);
    return {
      ...placeholder,
      metadata: {
        ...placeholder.metadata,
        fallbackReason: gatewayResult.error,
        gatewayAttempt: gatewayResult.metadata,
      },
    };
  }

  return executeLocalPlaceholder(packet, outputKind);
}

function shouldUseVercelGateway(outputKind: RenderOutputKind) {
  if (process.env.SOLACEFRAME_FORCE_PLACEHOLDER_RENDER === "true") return false;
  return Boolean(getGatewayApiKey());
}

function getGatewayApiKey() {
  return (
    process.env.VERCEL_AI_GATEWAY_API_KEY ||
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    null
  );
}

async function executeVercelGatewayRender(
  packet: Record<string, unknown>,
  outputKind: RenderOutputKind,
): Promise<RenderExecutionResult> {
  const model =
    process.env.SOLACEFRAME_IMAGE_MODEL || "google/gemini-3-pro-image";
  const promptText = buildGatewayImagePrompt(packet, outputKind);
  const visualAnchor = getPrimaryVisualAnchor(packet);
  const size = getImageSize();
  const startedAt = new Date().toISOString();
  const prompt = visualAnchor
    ? { text: promptText, images: [visualAnchor.publicUrl] }
    : promptText;

  try {
    const rawResult = (await generateImage({
      model,
      prompt,
      n: 1,
      size,
      providerOptions: buildImageProviderOptions(model) as any,
    } as any)) as unknown;

    const result = coerceRecord(
      rawResult,
      "Vercel AI Gateway image generation returned a non-object result.",
    );
    const extraction = extractGeneratedImage(result);

    if (!extraction.image) {
      return {
        status: "failed",
        provider: "vercel-ai-gateway-image",
        providerJobId: extractProviderJobId(result),
        artifactType: outputKind,
        artifactUrl: null,
        mimeType: "application/json",
        metadata: {
          packet,
          model,
          size,
          startedAt,
          completedAt: new Date().toISOString(),
          responseShape: summarizeImageResultShape(result),
          response: safeProviderResponse(result),
          v191: {
            providerClass: "ai-gateway-image",
            executionMode: "ai-sdk-generate-image",
            reason:
              "No supported image payload was found on result.image, result.images[0], result.files[0], or provider metadata.",
          },
          v19: buildContinuityLockMetadata(packet, outputKind),
        },
        error:
          "Vercel AI Gateway image generation returned successfully, but no supported image payload was found.",
      };
    }

    return {
      status: "completed",
      provider: "vercel-ai-gateway-image",
      providerJobId: extraction.providerJobId ?? extractProviderJobId(result),
      artifactType: outputKind,
      artifactUrl:
        extraction.image.url ??
        `data:${extraction.image.mimeType};base64,${extraction.image.base64}`,
      mimeType: extraction.image.mimeType,
      metadata: {
        packet,
        model,
        size,
        startedAt,
        completedAt: new Date().toISOString(),
        gatewayResponseId: extractProviderJobId(result),
        responseShape: summarizeImageResultShape(result),
        response: safeProviderResponse(result),
        v191: {
          providerClass: "ai-gateway-image",
          executionMode: "ai-sdk-generate-image",
          delivery: extraction.image.url ? "external-url" : "base64-data-url",
          extractionPath: extraction.path,
          storageBacked: true,
        },
        v19: buildContinuityLockMetadata(packet, outputKind),
      },
      error: null,
    };
  } catch (error) {
    return {
      status: "failed",
      provider: "vercel-ai-gateway-image",
      providerJobId: null,
      artifactType: outputKind,
      artifactUrl: null,
      mimeType: "application/json",
      metadata: {
        packet,
        model,
        size,
        startedAt,
        completedAt: new Date().toISOString(),
        v191: {
          providerClass: "ai-gateway-image",
          executionMode: "exception",
          message: error instanceof Error ? error.message : String(error),
        },
        v19: buildContinuityLockMetadata(packet, outputKind),
      },
      error:
        error instanceof Error
          ? error.message
          : "Unknown Vercel AI Gateway image execution error.",
    };
  }
}

async function executeVercelGatewayVideoRender(
  packet: Record<string, unknown>,
): Promise<RenderExecutionResult> {
  const visualAnchor = getPrimaryVisualAnchor(packet);
  const model =
    process.env.SOLACEFRAME_VIDEO_MODEL ||
    (visualAnchor ? "bytedance/seedance-v1.5-pro" : "bytedance/seedance-v1.0-pro-fast");
  const duration = Number(
    process.env.SOLACEFRAME_VIDEO_DURATION_SECONDS || "5",
  );
  const aspectRatio = getVideoAspectRatio();
  const resolution = getVideoResolution();
  const promptText = buildGatewayVideoPrompt(packet);
  const prompt = visualAnchor
    ? { image: visualAnchor.publicUrl, text: promptText }
    : promptText;
  const startedAt = new Date().toISOString();

  try {
    const rawResult = (await generateVideo({
      model,
      prompt,
      duration,
      aspectRatio,
      resolution,
      providerOptions: buildVideoProviderOptions(model) as any,
    })) as unknown;

    const result = coerceRecord(rawResult, "Vercel AI Gateway video generation returned a non-object result.");

    const extraction = extractGeneratedVideo(result);

    if (!extraction.video) {
      return {
        status: "failed",
        provider: "vercel-ai-gateway-video",
        providerJobId: extractProviderJobId(result),
        artifactType: "video",
        artifactUrl: null,
        mimeType: "application/json",
        metadata: {
          packet,
          model,
          duration,
          aspectRatio,
          resolution,
          startedAt,
          completedAt: new Date().toISOString(),
          responseShape: summarizeVideoResultShape(result),
          response: safeProviderResponse(result),
          v181: {
            providerClass: "ai-gateway-video",
            completionRuntime: "synchronous-ai-sdk-result-extraction",
            reason:
              "No supported video payload was found on result.video, result.videos[0], result.files[0], or provider metadata.",
          },
          v19: buildContinuityLockMetadata(packet, "video"),
        },
        error:
          "Vercel AI Gateway video generation returned successfully, but no supported video payload was found.",
      };
    }

    return {
      status: "completed",
      provider: "vercel-ai-gateway-video",
      providerJobId: extraction.providerJobId ?? extractProviderJobId(result),
      artifactType: "video",
      artifactUrl:
        extraction.video.url ??
        `data:${extraction.video.mimeType};base64,${extraction.video.base64}`,
      mimeType: extraction.video.mimeType,
      metadata: {
        packet,
        model,
        duration,
        aspectRatio,
        resolution,
        startedAt,
        completedAt: new Date().toISOString(),
        gatewayResponseId: extractProviderJobId(result),
        responseShape: summarizeVideoResultShape(result),
        response: safeProviderResponse(result),
        v181: {
          providerClass: "ai-gateway-video",
          storageBacked: true,
          executionMode: "completed-video-generation",
          delivery: extraction.video.url ? "external-url" : "base64-data-url",
          extractionPath: extraction.path,
        },
        v19: buildContinuityLockMetadata(packet, "video"),
      },
      error: null,
    };
  } catch (error) {
    return {
      status: "failed",
      provider: "vercel-ai-gateway-video",
      providerJobId: null,
      artifactType: "video",
      artifactUrl: null,
      mimeType: "application/json",
      metadata: {
        packet,
        model,
        duration,
        aspectRatio,
        resolution,
        startedAt,
        completedAt: new Date().toISOString(),
        v181: {
          providerClass: "ai-gateway-video",
          completionRuntime: "exception",
          message: error instanceof Error ? error.message : String(error),
        },
        v19: buildContinuityLockMetadata(packet, "video"),
      },
      error:
        error instanceof Error
          ? error.message
          : "Unknown Vercel AI Gateway video execution error.",
    };
  }
}


type ImageSize = `${number}x${number}`;

type ExtractedImagePayload = {
  url?: string;
  base64?: string;
  mimeType: string;
};

function getImageSize(): ImageSize {
  const raw = process.env.SOLACEFRAME_IMAGE_SIZE || "1536x864";
  return /^\d+x\d+$/.test(raw) ? (raw as ImageSize) : "1536x864";
}

function buildImageProviderOptions(model: string) {
  if (model.startsWith("google/")) {
    return {
      google: {
        aspectRatio: "16:9",
      },
    };
  }

  if (model.startsWith("openai/")) {
    return {
      openai: {
        quality: "high",
      },
    };
  }

  if (model.startsWith("xai/")) {
    return {
      xai: {},
    };
  }

  if (model.startsWith("black-forest-labs/") || model.startsWith("bfl/")) {
    return {
      blackForestLabs: {},
    };
  }

  return {};
}

function extractGeneratedImage(result: Record<string, unknown>): {
  image: ExtractedImagePayload | null;
  path: string | null;
  providerJobId: string | null;
} {
  const candidates: Array<{ value: unknown; path: string }> = [
    { value: result.image, path: "result.image" },
    {
      value: Array.isArray(result.images) ? result.images[0] : null,
      path: "result.images[0]",
    },
    {
      value: Array.isArray(result.files) ? result.files[0] : null,
      path: "result.files[0]",
    },
  ];

  const providerMetadata = result.providerMetadata;
  if (providerMetadata && typeof providerMetadata === "object") {
    const metadata = providerMetadata as Record<string, unknown>;
    for (const key of Object.keys(metadata)) {
      const value = metadata[key];
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        candidates.push({ value: record.image, path: `providerMetadata.${key}.image` });
        candidates.push({
          value: Array.isArray(record.images) ? record.images[0] : null,
          path: `providerMetadata.${key}.images[0]`,
        });
        candidates.push({ value: record.output, path: `providerMetadata.${key}.output` });
      }
    }
  }

  for (const candidate of candidates) {
    const image = normalizeImagePayload(candidate.value);
    if (image) {
      return {
        image,
        path: candidate.path,
        providerJobId: extractProviderJobId(result),
      };
    }
  }

  return {
    image: null,
    path: null,
    providerJobId: extractProviderJobId(result),
  };
}

function normalizeImagePayload(value: unknown): ExtractedImagePayload | null {
  if (!value) return null;

  if (typeof value === "string") {
    if (value.startsWith("data:image/")) {
      const mimeType = value.slice(5, value.indexOf(";"));
      return { base64: stripBase64Prefix(value), mimeType };
    }
    if (/^https?:\/\//i.test(value)) {
      return { url: value, mimeType: inferMimeTypeFromUrl(value) ?? "image/png" };
    }
    if (/^[A-Za-z0-9+/=\n\r]+$/.test(value) && value.length > 1000) {
      return { base64: value, mimeType: "image/png" };
    }
    return null;
  }

  if (value instanceof Uint8Array) {
    return { base64: Buffer.from(value).toString("base64"), mimeType: "image/png" };
  }

  if (value instanceof ArrayBuffer) {
    return { base64: Buffer.from(value).toString("base64"), mimeType: "image/png" };
  }

  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  const mimeType =
    stringValue(record.mediaType) ||
    stringValue(record.mimeType) ||
    stringValue(record.contentType) ||
    "image/png";

  const url =
    stringValue(record.url) ||
    stringValue(record.uri) ||
    stringValue(record.downloadUrl) ||
    stringValue(record.publicUrl);
  if (url) return { url, mimeType: inferMimeTypeFromUrl(url) ?? mimeType };

  const base64 =
    stringValue(record.base64) ||
    stringValue(record.b64_json) ||
    stringValue(record.data);
  if (base64) return { base64: stripBase64Prefix(base64), mimeType };

  const uint8Array = record.uint8Array;
  if (uint8Array instanceof Uint8Array) {
    return { base64: Buffer.from(uint8Array).toString("base64"), mimeType };
  }

  const arrayBuffer = record.arrayBuffer;
  if (arrayBuffer instanceof ArrayBuffer) {
    return { base64: Buffer.from(arrayBuffer).toString("base64"), mimeType };
  }

  return null;
}

function summarizeImageResultShape(result: Record<string, unknown>) {
  return {
    keys: Object.keys(result),
    hasImage: Boolean(result.image),
    imagesLength: Array.isArray(result.images) ? result.images.length : null,
    filesLength: Array.isArray(result.files) ? result.files.length : null,
    hasProviderMetadata: Boolean(result.providerMetadata),
    providerMetadataKeys:
      result.providerMetadata && typeof result.providerMetadata === "object"
        ? Object.keys(result.providerMetadata as Record<string, unknown>)
        : [],
  };
}

function coerceRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new Error(message);
  }

  return value as Record<string, unknown>;
}

type ExtractedVideoPayload = {
  url?: string;
  base64?: string;
  mimeType: string;
};

function extractGeneratedVideo(result: Record<string, unknown>): {
  video: ExtractedVideoPayload | null;
  path: string | null;
  providerJobId: string | null;
} {
  const candidates: Array<{ value: unknown; path: string }> = [
    { value: result.video, path: "result.video" },
    {
      value: Array.isArray(result.videos) ? result.videos[0] : null,
      path: "result.videos[0]",
    },
    {
      value: Array.isArray(result.files) ? result.files[0] : null,
      path: "result.files[0]",
    },
  ];

  const providerMetadata = result.providerMetadata;
  if (providerMetadata && typeof providerMetadata === "object") {
    const metadata = providerMetadata as Record<string, unknown>;
    for (const key of Object.keys(metadata)) {
      const value = metadata[key];
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        candidates.push({
          value: record.video,
          path: `providerMetadata.${key}.video`,
        });
        candidates.push({
          value: Array.isArray(record.videos) ? record.videos[0] : null,
          path: `providerMetadata.${key}.videos[0]`,
        });
        candidates.push({
          value: record.output,
          path: `providerMetadata.${key}.output`,
        });
      }
    }
  }

  for (const candidate of candidates) {
    const video = normalizeVideoPayload(candidate.value);
    if (video) {
      return {
        video,
        path: candidate.path,
        providerJobId: extractProviderJobId(result),
      };
    }
  }

  return {
    video: null,
    path: null,
    providerJobId: extractProviderJobId(result),
  };
}

function normalizeVideoPayload(value: unknown): ExtractedVideoPayload | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const mimeType =
    stringValue(record.mediaType) ||
    stringValue(record.mimeType) ||
    stringValue(record.contentType) ||
    "video/mp4";

  const url =
    stringValue(record.url) ||
    stringValue(record.uri) ||
    stringValue(record.downloadUrl) ||
    stringValue(record.publicUrl);
  if (url) return { url, mimeType: inferMimeTypeFromUrl(url) ?? mimeType };

  const base64 =
    stringValue(record.base64) ||
    stringValue(record.b64_json) ||
    stringValue(record.data);
  if (base64) return { base64: stripBase64Prefix(base64), mimeType };

  const uint8Array = record.uint8Array;
  if (uint8Array instanceof Uint8Array) {
    return { base64: Buffer.from(uint8Array).toString("base64"), mimeType };
  }

  const arrayBuffer = record.arrayBuffer;
  if (arrayBuffer instanceof ArrayBuffer) {
    return { base64: Buffer.from(arrayBuffer).toString("base64"), mimeType };
  }

  return null;
}

function stripBase64Prefix(value: string) {
  const commaIndex = value.indexOf(",");
  if (value.startsWith("data:") && commaIndex >= 0)
    return value.slice(commaIndex + 1);
  return value;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractProviderJobId(result: Record<string, unknown>) {
  return (
    stringValue(result.id) ||
    stringValue(result.responseId) ||
    stringValue((result.response as Record<string, unknown> | undefined)?.id) ||
    null
  );
}

function summarizeVideoResultShape(result: Record<string, unknown>) {
  return {
    keys: Object.keys(result),
    hasVideo: Boolean(result.video),
    videosLength: Array.isArray(result.videos) ? result.videos.length : null,
    filesLength: Array.isArray(result.files) ? result.files.length : null,
    hasProviderMetadata: Boolean(result.providerMetadata),
    providerMetadataKeys:
      result.providerMetadata && typeof result.providerMetadata === "object"
        ? Object.keys(result.providerMetadata as Record<string, unknown>)
        : [],
  };
}

function safeProviderResponse(result: Record<string, unknown>) {
  return {
    response: result.response ?? null,
    usage: result.usage ?? null,
    providerMetadata: result.providerMetadata ?? null,
    warnings: result.warnings ?? null,
  };
}

function buildVideoProviderOptions(model: string) {
  const pollIntervalMs = Number(
    process.env.SOLACEFRAME_VIDEO_POLL_INTERVAL_MS || "5000",
  );
  const pollTimeoutMs = Number(
    process.env.SOLACEFRAME_VIDEO_POLL_TIMEOUT_MS || "600000",
  );
  const audioEnabled = process.env.SOLACEFRAME_VIDEO_SOUND === "on";

  if (model.startsWith("klingai/")) {
    return {
      klingai: {
        mode: process.env.SOLACEFRAME_KLING_MODE || "pro",
        sound: audioEnabled ? "on" : "off",
        pollIntervalMs,
        pollTimeoutMs,
      },
    };
  }

  if (model.startsWith("alibaba/")) {
    return {
      alibaba: {
        promptExtend: true,
        sound: audioEnabled ? "on" : "off",
        pollIntervalMs,
        pollTimeoutMs,
      },
    };
  }

  if (model.startsWith("bytedance/")) {
    return {
      bytedance: {
        watermark: false,
        generateAudio: audioEnabled,
        pollIntervalMs,
        pollTimeoutMs,
      },
    };
  }

  if (model.startsWith("xai/")) {
    return {
      xai: {
        audio: audioEnabled,
        pollIntervalMs,
        pollTimeoutMs,
      },
    };
  }

  if (model.startsWith("google/veo")) {
    return {
      vertex: {
        generateAudio: audioEnabled,
        enhancePrompt: true,
        pollIntervalMs,
        pollTimeoutMs,
        personGeneration: "allow_adult",
      },
    };
  }

  return {};
}

function buildGatewayVideoPrompt(packet: Record<string, unknown>) {
  const continuity = packet.continuity as Record<string, unknown> | undefined;
  const world = continuity?.world as
    | { name?: string; pressure?: number; state?: unknown }
    | undefined;
  const branch = continuity?.activeBranch as
    | { name?: string; divergence_score?: number; status?: string }
    | undefined;
  const characters = Array.isArray(continuity?.characters)
    ? continuity.characters
    : [];
  const causalEvents = Array.isArray(continuity?.causalEvents)
    ? continuity.causalEvents.slice(0, 12)
    : [];
  const governance = packet.governance as Record<string, unknown> | undefined;
  const rendering = packet.rendering as Record<string, unknown> | undefined;
  const compiledPacket = packet.compiledPacket as
    | Record<string, unknown>
    | undefined;
  const prompt = String(
    packet.prompt ??
      rendering?.prompt ??
      "Render the governed runtime state as a short continuous video.",
  );

  return [
    "Create a short cinematic 16:9 video clip from this governed SolaceFrame runtime packet.",
    getPrimaryVisualAnchor(packet)
      ? "Use the provided reference image as the visual continuity anchor. Preserve the person, wardrobe silhouette, object geometry, lighting family, and environment from the reference frame. Animate the frame rather than redesigning the scene."
      : "No visual anchor is available; obey the textual continuity locks with maximum consistency.",
    "Use one continuous shot unless the packet explicitly permits a transition.",
    "Preserve continuity exactly: character identity, face family, hair color, wardrobe silhouette, carried yellow courier case, left-arm injury behavior, environmental damage, branch state, lighting, and object positions must stay consistent across the clip.",
    "Hard locks: Elena keeps the same visual identity; the yellow courier case remains visibly yellow and consistently shaped; the bridge/location remains damaged and rainy unless a repair event exists; do not convert the environment into a different city/bridge type.",
    "Do not introduce unsupported characters, locations, repairs, labels, logos, captions, UI overlays, or text in-frame.",
    "Motion direction: slow cinematic movement, physical realism, rain/environment continuity, visible tension, and clear causal consequence propagation.",
    "Primary scene prompt:",
    prompt,
    "Runtime world:",
    JSON.stringify(
      { name: world?.name, pressure: world?.pressure, state: world?.state },
      null,
      2,
    ),
    "Active branch:",
    JSON.stringify(
      {
        name: branch?.name,
        status: branch?.status,
        divergence: branch?.divergence_score,
      },
      null,
      2,
    ),
    "Characters and continuity anchors:",
    JSON.stringify(characters, null, 2),
    "Visual continuity anchors:",
    JSON.stringify((continuity?.visualAnchors as Record<string, unknown> | undefined) ?? {}, null, 2),
    "Recent causal events:",
    JSON.stringify(causalEvents, null, 2),
    "Governance constraints:",
    JSON.stringify(governance, null, 2),
    "Compiled render packet:",
    JSON.stringify(compiledPacket ?? {}, null, 2),
  ].join("\n\n");
}

function buildGatewayImagePrompt(
  packet: Record<string, unknown>,
  outputKind: RenderOutputKind,
) {
  const continuity = packet.continuity as Record<string, unknown> | undefined;
  const world = continuity?.world as
    | { name?: string; pressure?: number; state?: unknown }
    | undefined;
  const branch = continuity?.activeBranch as
    | { name?: string; divergence_score?: number; status?: string }
    | undefined;
  const characters = Array.isArray(continuity?.characters)
    ? continuity.characters
    : [];
  const causalEvents = Array.isArray(continuity?.causalEvents)
    ? continuity.causalEvents.slice(0, 8)
    : [];
  const governance = packet.governance as Record<string, unknown> | undefined;
  const rendering = packet.rendering as Record<string, unknown> | undefined;
  const compiledPacket = packet.compiledPacket as
    | Record<string, unknown>
    | undefined;
  const prompt = String(
    packet.prompt ?? rendering?.prompt ?? "Render the governed runtime state.",
  );
  const format =
    outputKind === "storyboard"
      ? "Create one cinematic 16:9 four-panel storyboard image. The panels must show sequential continuity checkpoints from the same branch."
      : "Create one cinematic 16:9 production still image.";

  return [
    format,
    "This is not concept art detached from state. It is a governed render of the exact runtime packet.",
    "No logos, no captions, no UI overlays, no text labels, and no placeholder graphics in the generated image.",
    "Visual style: sophisticated cinematic realism, high detail, coherent lighting, practical environment design, persistent objects, no surreal artifacts unless required by the runtime state.",
    getPrimaryVisualAnchor(packet)
      ? "Continuity anchor present: preserve the approved visual anchor as the dominant identity/environment reference. Do not redesign the character, jacket, yellow case, damaged bridge, weather, or camera language unless the runtime packet explicitly authorizes a branch divergence."
      : "No approved visual anchor is present; obey the textual continuity locks and avoid redesigning core identity or environment across outputs.",
    "Primary scene prompt:",
    prompt,
    "Runtime world:",
    JSON.stringify(
      { name: world?.name, pressure: world?.pressure, state: world?.state },
      null,
      2,
    ),
    "Active branch:",
    JSON.stringify(
      {
        name: branch?.name,
        status: branch?.status,
        divergence: branch?.divergence_score,
      },
      null,
      2,
    ),
    "Characters and continuity anchors:",
    JSON.stringify(characters, null, 2),
    "Visual continuity anchors:",
    JSON.stringify((continuity?.visualAnchors as Record<string, unknown> | undefined) ?? {}, null, 2),
    "Recent causal events:",
    JSON.stringify(causalEvents, null, 2),
    "Governance constraints:",
    JSON.stringify(governance, null, 2),
    "Compiled render packet:",
    JSON.stringify(compiledPacket ?? {}, null, 2),
  ].join("\n\n");
}

function extractGatewayImageUrl(data: GatewayCompletionResponse) {
  const topLevelImage = firstUrlFromImages(data.images);
  if (topLevelImage) return topLevelImage;

  for (const choice of data.choices ?? []) {
    const message = choice.message;
    const imageFromArray = firstUrlFromImages(message?.images);
    if (imageFromArray) return imageFromArray;

    const imageFromContent = firstUrlFromContent(message?.content);
    if (imageFromContent) return imageFromContent;
  }

  return null;
}

function firstUrlFromImages(images: GatewayImage[] | undefined) {
  for (const image of images ?? []) {
    if (typeof image.image_url?.url === "string") return image.image_url.url;
    if (typeof image.url === "string") return image.url;
    if (typeof image.b64_json === "string")
      return `data:image/png;base64,${image.b64_json}`;
    if (typeof image.base64 === "string")
      return `data:image/png;base64,${image.base64}`;
  }
  return null;
}

function firstUrlFromContent(content: unknown): string | null {
  if (typeof content === "string") {
    const dataUrlMatch = content.match(
      /data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+/,
    );
    if (dataUrlMatch?.[0]) return dataUrlMatch[0];
    const httpsImageMatch = content.match(
      /https?:\/\/\S+?\.(?:png|jpg|jpeg|webp|gif)(?:\?\S*)?/i,
    );
    if (httpsImageMatch?.[0]) return httpsImageMatch[0];
    return null;
  }

  if (!Array.isArray(content)) return null;

  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const record = part as Record<string, unknown>;
    if (record.type === "image_url") {
      const imageUrl = record.image_url as { url?: unknown } | undefined;
      if (typeof imageUrl?.url === "string") return imageUrl.url;
    }
    if (typeof record.url === "string") return record.url;
    if (typeof record.b64_json === "string")
      return `data:image/png;base64,${record.b64_json}`;
    if (typeof record.base64 === "string")
      return `data:image/png;base64,${record.base64}`;
  }
  return null;
}

async function executeWebhookRender(
  webhookUrl: string,
  packet: Record<string, unknown>,
  outputKind: RenderOutputKind,
): Promise<RenderExecutionResult> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SOLACEFRAME_RENDER_WEBHOOK_SECRET
        ? {
            Authorization: `Bearer ${process.env.SOLACEFRAME_RENDER_WEBHOOK_SECRET}`,
          }
        : {}),
    },
    body: JSON.stringify(packet),
  });

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    return {
      status: "failed",
      provider: "external-render-webhook",
      providerJobId:
        typeof data.providerJobId === "string" ? data.providerJobId : null,
      artifactType: outputKind,
      artifactUrl: null,
      mimeType: null,
      metadata: { packet, response: data, status: response.status },
      error:
        typeof data.error === "string"
          ? data.error
          : `Render webhook failed with HTTP ${response.status}`,
    };
  }

  return {
    status: "completed",
    provider: "external-render-webhook",
    providerJobId:
      typeof data.providerJobId === "string" ? data.providerJobId : null,
    artifactType: (typeof data.artifactType === "string"
      ? data.artifactType
      : outputKind) as RenderOutputKind,
    artifactUrl: typeof data.artifactUrl === "string" ? data.artifactUrl : null,
    mimeType:
      typeof data.mimeType === "string"
        ? data.mimeType
        : inferMimeType(outputKind),
    metadata: { packet, response: data },
    error: null,
  };
}

function executeLocalPlaceholder(
  packet: Record<string, unknown>,
  outputKind: RenderOutputKind,
): RenderExecutionResult {
  const artifactUrl =
    outputKind === "image" ? buildPlaceholderSvgDataUrl(packet) : null;
  return {
    status: "completed",
    provider: "solaceframe-local-placeholder",
    providerJobId: null,
    artifactType: outputKind,
    artifactUrl,
    mimeType: outputKind === "image" ? "image/svg+xml" : "application/json",
    metadata: {
      packet,
      note:
        outputKind === "image"
          ? "Local SVG placeholder generated. Add VERCEL_AI_GATEWAY_API_KEY or SOLACEFRAME_RENDER_WEBHOOK_URL to execute against a real image/video provider."
          : "Storyboard/video execution packet generated. Add a supported renderer to execute against real media.",
    },
    error: null,
  };
}

function buildPlaceholderSvgDataUrl(packet: Record<string, unknown>) {
  const continuity = packet.continuity as Record<string, unknown> | undefined;
  const world = continuity?.world as
    | { name?: string; pressure?: number }
    | undefined;
  const branch = continuity?.activeBranch as
    | { name?: string; divergence_score?: number }
    | undefined;
  const title = escapeSvg(String(world?.name ?? "SolaceFrame Runtime"));
  const pressure = escapeSvg(String(world?.pressure ?? "unknown"));
  const branchName = escapeSvg(String(branch?.name ?? "active branch"));
  const divergence = escapeSvg(String(branch?.divergence_score ?? "0"));
  const barWidth = Math.max(24, Math.min(600, Number(pressure) * 6 || 220));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet">
  <defs><radialGradient id="g1" cx="20%" cy="10%" r="80%"><stop offset="0" stop-color="#facc15" stop-opacity=".35"/><stop offset=".45" stop-color="#0f172a"/><stop offset="1" stop-color="#020617"/></radialGradient><linearGradient id="g2" x1="0" x2="1"><stop offset="0" stop-color="#22c55e"/><stop offset=".55" stop-color="#facc15"/><stop offset="1" stop-color="#ef4444"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#g1)"/><g opacity=".24" stroke="#ffffff" stroke-width="1"><path d="M90 560 C330 310 520 620 750 390 S1030 330 1190 145" fill="none"/><path d="M130 150 C330 300 510 100 690 235 S940 470 1160 360" fill="none"/></g>
  <rect x="72" y="72" width="1136" height="576" rx="36" fill="#020617" opacity=".74" stroke="#ffffff" stroke-opacity=".14"/>
  <text x="112" y="142" fill="#facc15" font-size="20" font-family="Arial" font-weight="700" letter-spacing="5">SOLACEFRAME V18 EXECUTION ARTIFACT</text><text x="112" y="224" fill="#ffffff" font-size="56" font-family="Arial" font-weight="900">${title}</text><text x="112" y="282" fill="#cbd5e1" font-size="26" font-family="Arial">Governed fallback render · no live image provider response was used</text>
  <rect x="112" y="360" width="600" height="22" rx="11" fill="#ffffff" opacity=".12"/><rect x="112" y="360" width="${barWidth}" height="22" rx="11" fill="url(#g2)"/>
  <text x="112" y="438" fill="#ffffff" font-size="32" font-family="Arial" font-weight="700">World pressure: ${pressure}%</text><text x="112" y="492" fill="#ffffff" font-size="32" font-family="Arial" font-weight="700">Branch: ${branchName}</text><text x="112" y="546" fill="#ffffff" font-size="32" font-family="Arial" font-weight="700">Divergence: ${divergence}%</text><text x="112" y="610" fill="#94a3b8" font-size="20" font-family="Arial">V18 routes image, storyboard, and video execution through governed provider surfaces.</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&quot;";
  });
}

function inferMimeType(outputKind: RenderOutputKind) {
  if (outputKind === "image") return "image/png";
  if (outputKind === "video") return "video/mp4";
  return "application/json";
}

function inferMimeTypeFromUrl(url: string) {
  if (url.startsWith("data:image/png")) return "image/png";
  if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg"))
    return "image/jpeg";
  if (url.startsWith("data:image/webp")) return "image/webp";
  if (url.startsWith("data:image/svg")) return "image/svg+xml";
  if (/\.png(?:\?|$)/i.test(url)) return "image/png";
  if (/\.(jpg|jpeg)(?:\?|$)/i.test(url)) return "image/jpeg";
  if (/\.webp(?:\?|$)/i.test(url)) return "image/webp";
  if (/\.svg(?:\?|$)/i.test(url)) return "image/svg+xml";
  return null;
}
