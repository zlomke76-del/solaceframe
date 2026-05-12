# SolaceFrame Studio

V16 connects the governed runtime execution path to a live provider boundary while preserving the local placeholder fallback.

## Execution order

1. Runtime admissibility must allow or conditionally allow execution.
2. `SOLACEFRAME_RENDER_WEBHOOK_URL`, when present, remains the first external execution route.
3. If no webhook exists and `VERCEL_AI_GATEWAY_API_KEY` is available, image and storyboard jobs execute through Vercel AI Gateway.
4. If Gateway execution fails and `SOLACEFRAME_DISABLE_PLACEHOLDER_FALLBACK` is not `true`, SolaceFrame persists a local SVG fallback artifact with Gateway failure metadata.
5. Video jobs remain packet-only/fallback until a video-capable adapter or webhook is attached.

## Environment variables

Required for live Gateway image execution:

```bash
VERCEL_AI_GATEWAY_API_KEY=...
```

Optional:

```bash
SOLACEFRAME_IMAGE_MODEL=google/gemini-3-pro-image
SOLACEFRAME_RENDER_WEBHOOK_URL=https://your-render-worker.example.com/render
SOLACEFRAME_RENDER_WEBHOOK_SECRET=...
SOLACEFRAME_FORCE_PLACEHOLDER_RENDER=false
SOLACEFRAME_DISABLE_PLACEHOLDER_FALLBACK=false
```

The default Gateway model is `google/gemini-3-pro-image`. Change `SOLACEFRAME_IMAGE_MODEL` if your Vercel AI Gateway project has a different image-capable model enabled.
