# SolaceFrame Studio V18

V18 adds live AI Gateway video execution to the existing governed runtime flow.

Default video model:

```text
bytedance/seedance-2.0-fast
```

Override with:

```text
SOLACEFRAME_VIDEO_MODEL=klingai/kling-v3.0-t2v
```

The execution path is:

```text
runtime admissibility → render packet → AI Gateway video generation → Supabase Storage artifact → UI playback
```
