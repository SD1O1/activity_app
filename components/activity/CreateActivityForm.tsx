"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CreateActivityForm({ userId }: { userId: string }) {
  const router = useRouter();

  const [questions, setQuestions] = useState<string[]>([
    "",
  ]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"group" | "one-on-one">("group");
  const [loading, setLoading] = useState(false);
  const [costRule, setCostRule] = useState("everyone_pays");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    setLoading(true);

    const cleanedQuestions = questions
    .map(q => q.trim())
    .filter(q => q.length > 0);

    const { error } = await supabase.from("activities").insert({
      title,
      category,
      description,
      location,
      starts_at: date,
      type,
      cost_rule: costRule,
      host_id: userId,
      questions: cleanedQuestions,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/activities");
  };

  return (
    <div className="px-4 py-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Create an Activity</h1>

      {/* Activity title */}
      <div className="mb-5">
        <label className="text-sm font-medium">Activity title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Evening Coffee & Walk"
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="text-sm font-medium">Category</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Search categories"
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />
      </div>

      {/* Activity type */}
      <div className="mb-5">
        <label className="text-sm font-medium">Activity type</label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={() => setType("one-on-one")}
            className={`rounded-xl border py-3 ${
              type === "one-on-one" ? "bg-black text-white" : ""
            }`}
          >
            One-on-One
          </button>

          <button
            onClick={() => setType("group")}
            className={`rounded-xl border py-3 ${
              type === "group" ? "bg-black text-white" : ""
            }`}
          >
            Group
          </button>
        </div>
      </div>

      {/* Location */}
      <div className="mb-5">
        <label className="text-sm font-medium">
          Location
        </label>

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Marine Drive, Mumbai"
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />

        <p className="mt-1 text-xs text-gray-500">
          Exact location will be shared after approval
        </p>
      </div>

      {/* Date & time */}
      <div className="mb-5">
        <label className="text-sm font-medium">Date & Time</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3"
        />
      </div>

      <div className="mb-5">
        <label className="text-sm font-medium">Cost</label>
        <select
          value={costRule}
          onChange={(e) => setCostRule(e.target.value)}
          className="mt-2 w-full rounded-xl border px-4 py-3"
        >
          <option value="everyone_pays">Everyone pays their own</option>
          <option value="host_pays">Host will cover it</option>
          <option value="split">Split equally</option>
        </select>
      </div>

      {/* Description */}
      <div className="mb-5">
        <label className="text-sm font-medium">
          About this activity
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this activity is about, what people should expect..."
          rows={4}
          className="mt-2 w-full rounded-xl border px-4 py-3 resize-none"
        />
      </div>

      {/* Questions */}
      <div className="mb-8">
        <label className="text-sm font-medium">
          Questions for people who want to join
        </label>

        <div className="mt-3 space-y-3">
          {questions.map((q, index) => (
            <input
              placeholder="e.g. What do you like to talk about?"
              key={index}
              value={q}
              onChange={(e) => {
                const updated = [...questions];
                updated[index] = e.target.value;
                setQuestions(updated);
              }}
              className="w-full rounded-xl border px-4 py-3"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setQuestions([...questions, ""])}
          className="mt-3 text-sm text-blue-600"
        >
          + Add another question
        </button>
      </div>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full rounded-xl bg-black py-4 text-white font-medium"
      >
        {loading ? "Creating..." : "Create Activity"}
      </button>
    </div>
  );
}