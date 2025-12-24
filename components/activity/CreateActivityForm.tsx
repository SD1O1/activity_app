"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CreateActivityForm({ userId }: { userId: string }) {
  const router = useRouter();

  const [questions, setQuestions] = useState<string[]>([
    "What kind of conversation do you enjoy?",
    "What do you do?",
  ]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"group" | "one-on-one">("group");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);

    const { error } = await supabase.from("activities").insert({
      title,
      category,
      location,
      date,
      type,
      host_id: userId,
      questions,
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

      {/* Questions */}
      <div className="mb-8">
        <label className="text-sm font-medium">
          Questions for people who want to join
        </label>

        <div className="mt-3 space-y-3">
          {questions.map((q, index) => (
            <input
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