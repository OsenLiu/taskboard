import { useEffect, useState } from "react";
import { api, type AIModelOption } from "../api/client";
import { FALLBACK_AI_MODELS } from "../constants/aiModels";

let cachedModels: AIModelOption[] | undefined;
let pendingModels: Promise<AIModelOption[]> | undefined;

function loadModels() {
  if (cachedModels) return Promise.resolve(cachedModels);
  if (!pendingModels) {
    pendingModels = api.settings.listAIModels().then((catalog) => {
      cachedModels = [
        { id: "auto", name: "Auto (recommended)" },
        ...catalog.models.filter((model) => model.id !== "auto"),
      ];
      return cachedModels;
    });
  }
  return pendingModels;
}

export function useAIModels() {
  const [models, setModels] = useState<AIModelOption[]>(cachedModels || FALLBACK_AI_MODELS);

  useEffect(() => {
    let active = true;
    loadModels()
      .then((availableModels) => {
        if (active) setModels(availableModels);
      })
      .catch(() => {
        pendingModels = undefined;
      });
    return () => {
      active = false;
    };
  }, []);

  return models;
}