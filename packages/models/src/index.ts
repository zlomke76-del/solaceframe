export interface GenerationRequest {
  prompt: string;
  mode: "image" | "video";
}

export interface GenerationResult {
  success: boolean;
  assetUrl?: string;
}

export interface ModelAdapter {
  generate(
    request: GenerationRequest
  ): Promise<GenerationResult>;
}
