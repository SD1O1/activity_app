"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  activity: {
    id: string;
    title: string;
    description: string;
    type: "group" | "one-on-one";
    max_members: number;
    cost_rule: string;
    host_id: string; 
  };
  onUpdated: () => Promise<void>;
};

export default function EditActivityModal({
  open,
  onClose,
  activity,
  onUpdated,
}: Props) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description);
  const [type, setType] = useState(activity.type);
  const [maxMembers, setMaxMembers] = useState(activity.max_members);
  const [costRule, setCostRule] = useState(activity.cost_rule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const res = await fetch(
      `/api/activities/${activity.id}/update`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          cost_rule: costRule,
          max_members: type === "group" ? maxMembers : 2,
        }),
      }
    );
    
    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      setError(payload.error || "Failed to update activity");
      setSaving(false);
      return;
    }    

    // 🔔 Notify participants (best effort — don't block UI)
    fetch(`/api/activities/${activity.id}/notify-update`, {
      method: "POST",
    }).catch(() => {});

    await onUpdated();
    onClose();
    setSaving(false);
  };

  const typeButtonClass = (active: boolean) =>
    `flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
      active
        ? "border-[#f97316] bg-[#f97316] text-white shadow-[0_12px_24px_-16px_rgba(249,115,22,0.75)]"
        : "border-orange-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/35 backdrop-blur-[2px]">
      <div className="w-full space-y-4 rounded-t-[2rem] border border-orange-100/80 bg-gradient-to-b from-[#fff8f4] via-[#fffaf7] to-[#fffefe] p-4 sm:mx-auto sm:mb-4 sm:max-w-2xl sm:rounded-[1.75rem] sm:p-6 sm:shadow-[0_28px_50px_-34px_rgba(15,23,42,0.6)]">
        <div className="flex justify-center pb-1">
          <div className="h-1.5 w-10 rounded-full bg-orange-200" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Edit Activity
        </h2>

        {/* TITLE */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          placeholder="Activity title"
        />

        {/* DESCRIPTION */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          placeholder="Description"
        />

        {/* TYPE */}
        <div className="flex gap-2">
          <button
            onClick={() => setType("one-on-one")}
            className={typeButtonClass(type === "one-on-one")}
          >
            One-on-One
          </button>
          <button
            onClick={() => setType("group")}
            className={typeButtonClass(type === "group")}
          >
            Group
          </button>
        </div>

        {/* MAX MEMBERS */}
        {type === "group" && (
          <input
            type="number"
            min={1}
            value={maxMembers}
            onChange={(e) =>
              setMaxMembers(Number(e.target.value))
            }
            className="w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            placeholder="Max members"
          />
        )}

        {/* COST RULE */}
        <select
          value={costRule}
          onChange={(e) => setCostRule(e.target.value)}
          className="w-full rounded-2xl border border-orange-200 bg-orange-50/45 px-4 py-3 text-slate-900 transition-all duration-200 focus:border-orange-300 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          <option value="everyone_pays">
            Everyone pays
          </option>
          <option value="host_pays">
            Host pays
          </option>
          <option value="split">
            Split equally
          </option>
        </select>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ACTIONS */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl border border-[#f97316] bg-[#f97316] py-3 font-semibold text-white shadow-[0_18px_30px_-20px_rgba(249,115,22,0.8)] transition-all duration-200 hover:bg-[#ea6a11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        <button
          onClick={onClose}
          className="w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
