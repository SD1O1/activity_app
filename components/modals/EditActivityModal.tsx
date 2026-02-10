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
          host_id: activity.host_id,
        }),
      }
    );
    
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Failed to update activity");
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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
      <div className="w-full bg-white rounded-t-2xl p-4 space-y-4">
        <h2 className="font-semibold text-lg">
          Edit Activity
        </h2>

        {/* TITLE */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
          placeholder="Activity title"
        />

        {/* DESCRIPTION */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border rounded-xl px-4 py-3"
          placeholder="Description"
        />

        {/* TYPE */}
        <div className="flex gap-2">
          <button
            onClick={() => setType("one-on-one")}
            className={`flex-1 border rounded-xl py-3 ${
              type === "one-on-one"
                ? "bg-black text-white"
                : ""
            }`}
          >
            One-on-One
          </button>
          <button
            onClick={() => setType("group")}
            className={`flex-1 border rounded-xl py-3 ${
              type === "group"
                ? "bg-black text-white"
                : ""
            }`}
          >
            Group
          </button>
        </div>

        {/* MAX MEMBERS */}
        {type === "group" && (
          <input
            type="number"
            min={2}
            value={maxMembers}
            onChange={(e) =>
              setMaxMembers(Number(e.target.value))
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Max members"
          />
        )}

        {/* COST RULE */}
        <select
          value={costRule}
          onChange={(e) => setCostRule(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
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
          className="w-full bg-black text-white rounded-xl py-3"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}