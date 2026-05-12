import type {
  Admissibility,
  RenderOutputKind,
  RuntimeAdmissibilityReport,
  RuntimeRenderJob,
  RuntimeState
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

function decisionAllowsExecution(decision: Admissibility) {
  return decision === "allow" || decision === "conditional";
}

export function buildExecutionPacket(job: RuntimeRenderJob, state: RuntimeState, outputKind: RenderOutputKind) {
  const unresolvedContradictions = state.contradictions.filter((item) => !item.resolved);
  const activeCharacters = state.characters.map((character) => ({
    id: character.id,
    name: character.name,
    role: character.role,
    appearanceAnchor: character.appearance_anchor,
    runtimeState: character.state,
    continuityScore: character.continuity_score,
    pressure: character.pressure
  }));

  return {
    version: "v15-execution-packet",
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
        severity: item.severity
      }))
    },
    continuity: {
      project: state.project,
      world: state.world,
      activeBranch: state.activeBranch,
      characters: activeCharacters,
      latestContinuityDiff: state.continuityDiffs[0] ?? null,
      causalEvents: state.causalEvents.slice(0, 30)
    },
    rendering: buildRenderInstructions(outputKind, job.prompt, state.admissibilityReport)
  };
}

function buildRenderInstructions(
  outputKind: RenderOutputKind,
  prompt: string,
  report: RuntimeAdmissibilityReport
) {
  const base = [
    "Render only the governed runtime state provided in the packet.",
    "Preserve character identity, appearance anchors, carried objects, injuries, environment damage, and branch context.",
    "Do not repair contradictions implicitly; render unresolved contradictions as visible tension or defer execution if required.",
    "Maintain causal lineage and avoid introducing unsupported objects, locations, or authority changes."
  ];

  if (outputKind === "video") {
    return {
      mode: "temporal-video",
      durationSeconds: 5,
      frames: 24,
      instructions: [
        ...base,
        "Use a single continuous shot unless the packet explicitly permits a transition.",
        "Preserve camera direction and object positions across the clip."
      ],
      prompt
    };
  }

  if (outputKind === "storyboard") {
    return {
      mode: "multi-frame-storyboard",
      frames: 4,
      instructions: [
        ...base,
        "Return storyboard frames as continuity checkpoints rather than independent images."
      ],
      prompt
    };
  }

  return {
    mode: "single-image",
    instructions: base,
    prompt
  };
}

export async function executeRenderRequest({
  job,
  outputKind,
  state
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
        report: state.admissibilityReport
      },
      error: "Runtime admissibility blocked render execution."
    };
  }

  const packet = buildExecutionPacket(job, state, outputKind);
  const webhookUrl = process.env.SOLACEFRAME_RENDER_WEBHOOK_URL;

  if (webhookUrl) {
    return executeWebhookRender(webhookUrl, packet, outputKind);
  }

  return executeLocalPlaceholder(packet, outputKind);
}

async function executeWebhookRender(
  webhookUrl: string,
  packet: Record<string, unknown>,
  outputKind: RenderOutputKind
): Promise<RenderExecutionResult> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SOLACEFRAME_RENDER_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.SOLACEFRAME_RENDER_WEBHOOK_SECRET}` }
        : {})
    },
    body: JSON.stringify(packet)
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    return {
      status: "failed",
      provider: "external-render-webhook",
      providerJobId: typeof data.providerJobId === "string" ? data.providerJobId : null,
      artifactType: outputKind,
      artifactUrl: null,
      mimeType: null,
      metadata: { packet, response: data, status: response.status },
      error: typeof data.error === "string" ? data.error : `Render webhook failed with HTTP ${response.status}`
    };
  }

  return {
    status: "completed",
    provider: "external-render-webhook",
    providerJobId: typeof data.providerJobId === "string" ? data.providerJobId : null,
    artifactType: (typeof data.artifactType === "string" ? data.artifactType : outputKind) as RenderOutputKind,
    artifactUrl: typeof data.artifactUrl === "string" ? data.artifactUrl : null,
    mimeType: typeof data.mimeType === "string" ? data.mimeType : inferMimeType(outputKind),
    metadata: { packet, response: data },
    error: null
  };
}

function executeLocalPlaceholder(packet: Record<string, unknown>, outputKind: RenderOutputKind): RenderExecutionResult {
  const artifactUrl = outputKind === "image" ? buildPlaceholderSvgDataUrl(packet) : null;

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
          ? "Local SVG placeholder generated. Add SOLACEFRAME_RENDER_WEBHOOK_URL to execute against a real image/video provider."
          : "Storyboard/video execution packet generated. Add SOLACEFRAME_RENDER_WEBHOOK_URL to execute against a real renderer."
    },
    error: null
  };
}

function buildPlaceholderSvgDataUrl(packet: Record<string, unknown>) {
  const continuity = packet.continuity as Record<string, unknown> | undefined;
  const world = continuity?.world as { name?: string; pressure?: number } | undefined;
  const branch = continuity?.activeBranch as { name?: string; divergence_score?: number } | undefined;
  const title = escapeSvg(String(world?.name ?? "SolaceFrame Runtime"));
  const pressure = escapeSvg(String(world?.pressure ?? "unknown"));
  const branchName = escapeSvg(String(branch?.name ?? "active branch"));
  const divergence = escapeSvg(String(branch?.divergence_score ?? "0"));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="864" viewBox="0 0 1536 864">
  <defs>
    <radialGradient id="g1" cx="20%" cy="10%" r="80%"><stop offset="0" stop-color="#facc15" stop-opacity=".35"/><stop offset=".45" stop-color="#0f172a"/><stop offset="1" stop-color="#020617"/></radialGradient>
    <linearGradient id="g2" x1="0" x2="1"><stop offset="0" stop-color="#22c55e"/><stop offset=".55" stop-color="#facc15"/><stop offset="1" stop-color="#ef4444"/></linearGradient>
  </defs>
  <rect width="1536" height="864" fill="url(#g1)"/>
  <g opacity=".24" stroke="#ffffff" stroke-width="1">
    <path d="M140 640 C420 380 580 720 840 460 S1240 360 1390 170" fill="none"/>
    <path d="M160 180 C370 340 530 120 730 270 S1110 560 1360 420" fill="none"/>
  </g>
  <rect x="96" y="92" width="1344" height="680" rx="42" fill="#020617" opacity=".72" stroke="#ffffff" stroke-opacity=".14"/>
  <text x="140" y="170" fill="#facc15" font-size="24" font-family="Arial" font-weight="700" letter-spacing="6">SOLACEFRAME V15 EXECUTION ARTIFACT</text>
  <text x="140" y="260" fill="#ffffff" font-size="68" font-family="Arial" font-weight="900">${title}</text>
  <text x="140" y="326" fill="#cbd5e1" font-size="30" font-family="Arial">Governed placeholder render · continuity packet executed locally</text>
  <rect x="140" y="430" width="720" height="24" rx="12" fill="#ffffff" opacity=".12"/>
  <rect x="140" y="430" width="${Math.max(20, Math.min(720, Number(pressure) * 7.2 || 240))}" height="24" rx="12" fill="url(#g2)"/>
  <text x="140" y="512" fill="#ffffff" font-size="34" font-family="Arial" font-weight="700">World pressure: ${pressure}%</text>
  <text x="140" y="570" fill="#ffffff" font-size="34" font-family="Arial" font-weight="700">Branch: ${branchName}</text>
  <text x="140" y="628" fill="#ffffff" font-size="34" font-family="Arial" font-weight="700">Divergence: ${divergence}%</text>
  <text x="140" y="704" fill="#94a3b8" font-size="24" font-family="Arial">Set SOLACEFRAME_RENDER_WEBHOOK_URL to route this packet into an external image/video renderer.</text>
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
