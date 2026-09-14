import { useEffect, useState } from "react";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { api } from "../api/client";
import { useAIModels } from "../hooks/useAIModels";

export default function Settings() {
  const aiModels = useAIModels();
  const [limit, setLimit] = useState("30");
  const [model, setModel] = useState("auto");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.settings.getAICreditLimit(), api.settings.getAIModel()])
      .then(([limitSetting, modelSetting]) => {
        setLimit(limitSetting.value);
        setModel(modelSetting.value || "auto");
      })
      .catch(() => setError("Unable to load settings"));
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(limit);
    if (!Number.isInteger(value) || value < 30) {
      setError("The AI credit limit must be an integer of at least 30.");
      return;
    }
    const selectedModel = model.trim();
    if (!selectedModel) {
      setError("The AI model must not be empty.");
      return;
    }
    try {
      await api.settings.updateAICreditLimit(value);
      await api.settings.updateAIModel(selectedModel);
      setLimit(String(value));
      setModel(selectedModel);
      setSaved(true);
      setError("");
    } catch {
      setSaved(false);
      setError("Unable to save settings");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 flex items-center gap-3 px-6 h-14 border-b border-slate-800">
        <SettingsIcon className="w-5 h-5 text-slate-400" />
        <h1 className="text-lg font-semibold text-white">Settings</h1>
      </header>
      <form onSubmit={save} className="max-w-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-medium text-white">AI automation</h2>
          <p className="mt-1 text-sm text-slate-500">
            Daily AI credit budget used by the scheduled Taskboard agent.
          </p>
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-slate-400 mb-1.5">AI credit limit</span>
          <input
            type="number"
            min="30"
            step="1"
            value={limit}
            onChange={(event) => { setLimit(event.target.value); setSaved(false); }}
            className="w-40 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="ml-3 text-xs text-slate-600">Minimum: 30 credits</span>
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-slate-400 mb-1.5">AI model</span>
          <select
            value={model}
            onChange={(event) => { setModel(event.target.value); setSaved(false); }}
            className="w-64 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {!aiModels.some((option) => option.id === model) && (
              <option value={model}>{model} (saved)</option>
            )}
            {aiModels.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <span className="block mt-1 text-xs text-slate-600">
            Availability depends on your GitHub Copilot plan.
          </span>
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            <Save className="w-4 h-4" />
            Save
          </button>
          {saved && <span className="text-sm text-green-400">Saved</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </form>
    </div>
  );
}