"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/ToastProvider";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { ssr: false });

type Tag = { id: string; name: string };

export default function CreateActivityForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<string[]>([""]);
  const [title, setTitle] = useState("");
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");
  const [type, setType] = useState<"group" | "one-on-one">("group");
  const [maxMembers, setMaxMembers] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [costRule, setCostRule] = useState("everyone_pays");
  const [description, setDescription] = useState("");

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagError, setTagError] = useState("");
  const [isSearchingTags, setIsSearchingTags] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const startsAt = useMemo(() => {
    if (!datePart || !timePart) return "";
    return `${datePart}T${timePart}`;
  }, [datePart, timePart]);

  const resetForm = () => {
    setQuestions([""]);
    setTitle("");
    setDatePart("");
    setTimePart("");
    setType("group");
    setMaxMembers(2);
    setCostRule("everyone_pays");
    setDescription("");
    setSelectedTags([]);
    setTagError("");
    setIsSearchingTags(false);
    setTagQuery("");
    setFilteredTags([]);
    setShowLocationPicker(false);
    setFormError(null);
    setLocation(null);
  };

  const removeTag = (tagId: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag.id !== tagId));
  };

  const handleTagSearch = async (value: string) => {
    setTagQuery(value);

    if (value.trim().length === 0) {
      setFilteredTags([]);
      setIsSearchingTags(false);
      return;
    }

    setIsSearchingTags(true);

    const { data } = await supabase.from("activity_tags").select("id, name").ilike("name", `${value}%`).limit(10);

    setFilteredTags(data || []);
  };

  const toggleTag = (tag: Tag) => {
    if (selectedTags.some((t) => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
      setTagError("");
      return;
    }

    if (selectedTags.length >= 2) {
      setTagError("You can select up to 2 tags only");
      return;
    }

    setSelectedTags([...selectedTags, tag]);
    setTagError("");
  };

  const handleCreate = async () => {
    setLoading(true);
    setFormError(null);

    const cleanedQuestions = questions.map((q) => q.trim()).filter((q) => q.length > 0);

    if (!title.trim()) {
      setFormError("Please enter an activity title.");
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setFormError("Please add a short activity description.");
      setLoading(false);
      return;
    }

    if (type === "group" && (!Number.isFinite(maxMembers) || maxMembers < 2)) {
      setFormError("Max members must be at least 2 for group activities.");
      setLoading(false);
      return;
    }

    if (!location) {
      setFormError("Please choose a location.");
      setLoading(false);
      return;
    }

    if (!startsAt) {
      setFormError("Please choose date and time.");
      setLoading(false);
      return;
    }

    const startsAtMs = new Date(startsAt).getTime();
    if (Number.isNaN(startsAtMs) || startsAtMs < Date.now()) {
      setFormError("Please choose a future date and time.");
      setLoading(false);
      return;
    }

    const getPublicCoords = (lat: number, lng: number) => {
      const OFFSET = 0.003;
      return {
        public_lat: lat + (Math.random() - 0.5) * OFFSET,
        public_lng: lng + (Math.random() - 0.5) * OFFSET,
      };
    };

    const { public_lat, public_lng } = getPublicCoords(location.lat, location.lng);

    const rollbackCreate = async (activityId: string, conversationId?: string) => {
      if (conversationId) {
        await supabase.from("conversation_participants").delete().eq("conversation_id", conversationId);
        await supabase.from("conversations").delete().eq("id", conversationId);
      }
      await supabase.from("activities").delete().eq("id", activityId);
    };

    const { data: activity, error } = await supabase
      .from("activities")
      .insert({
        title,
        description,
        location_name: location.name,
        exact_lat: location.lat,
        exact_lng: location.lng,
        public_lat,
        public_lng,
        starts_at: startsAt,
        type,
        cost_rule: costRule,
        host_id: userId,
        questions: cleanedQuestions,
        max_members: type === "one-on-one" ? 2 : maxMembers,
      })
      .select()
      .single();

    if (error || !activity) {
      setFormError(error?.message || "Failed to create activity");
      setLoading(false);
      return;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ activity_id: activity.id })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      await rollbackCreate(activity.id);
      setFormError(conversationError?.message || "Failed to initialize activity chat");
      setLoading(false);
      return;
    }

    const { error: hostParticipantError } = await supabase.from("conversation_participants").insert({
      conversation_id: conversation.id,
      user_id: userId,
      last_seen_at: null,
    });

    if (hostParticipantError) {
      await rollbackCreate(activity.id, conversation.id);
      setFormError(hostParticipantError.message || "Failed to initialize activity chat participants");
      setLoading(false);
      return;
    }

    if (selectedTags.length === 0) {
      await rollbackCreate(activity.id, conversation.id);
      setFormError("Please select at least one activity tag");
      setLoading(false);
      return;
    }

    const { error: tagInsertError } = await supabase.from("activity_tag_relations").insert(
      selectedTags.map((tag) => ({ activity_id: activity.id, tag_id: tag.id }))
    );

    if (tagInsertError) {
      await rollbackCreate(activity.id, conversation.id);
      setFormError(tagInsertError.message || "Failed to link activity tags");
      setLoading(false);
      return;
    }

    setLoading(false);
    showToast("Activity created successfully", "success");
    router.push("/activities");
  };

  return (
    <div className="mx-auto w-full max-w-[700px] pb-32">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-[#f4f4f5]/95 px-5 backdrop-blur-sm">
        <button onClick={() => router.back()} className="text-[1.05rem] font-medium text-[#9a734c]">Cancel</button>
        <h1 className="text-[2rem] font-bold text-neutral-900 sm:text-[2.1rem]">Create Activity</h1>
        <button onClick={resetForm} className="text-[1.05rem] font-medium text-[#9a734c]">Reset</button>
      </header>

      <div className="space-y-8 px-5 py-6">
        <section>
          <h2 className="text-[2.75rem] font-bold tracking-tight text-neutral-900">Category</h2>
          <div className="relative mt-4">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
            <input
              value={tagQuery}
              onChange={(e) => handleTagSearch(e.target.value)}
              placeholder="Search category"
              className="w-full rounded-2xl border border-neutral-200 bg-white py-4 pl-11 pr-4 text-[1.05rem] text-neutral-700 placeholder:text-slate-400"
              disabled={selectedTags.length >= 2}
            />
          </div>

          {filteredTags.length > 0 && (
            <div className="mt-2 rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    toggleTag(tag);
                    setTagQuery("");
                    setFilteredTags([]);
                  }}
                  className="block w-full px-4 py-3 text-left text-base hover:bg-neutral-50"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span key={tag.id} className="flex items-center gap-2 rounded-full bg-[#ee8c2b] px-3 py-1 text-sm font-semibold text-white">
                {tag.name}
                <button onClick={() => removeTag(tag.id)}>✕</button>
              </span>
            ))}
          </div>
          {tagError ? <p className="mt-2 text-sm text-red-600">{tagError}</p> : null}
          {isSearchingTags && filteredTags.length === 0 && <p className="mt-2 text-sm text-neutral-500">No matching tags found</p>}
        </section>

        <section>
          <h2 className="text-[2.1rem] font-bold tracking-tight text-neutral-900">Details</h2>
          <label className="mt-4 block text-[1.05rem] text-[#9a734c]">Activity Title</label>
          <div className="relative mt-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give it a catchy title"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pr-11 text-[1.05rem] text-neutral-700 placeholder:text-slate-400"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">✎</span>
          </div>

          <label className="mt-5 block text-[1.05rem] text-[#9a734c]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the plan..."
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem] text-neutral-700 placeholder:text-slate-400"
          />
        </section>

        <section>
          <h2 className="text-[2.1rem] font-bold tracking-tight text-neutral-900">Logistics</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[1.05rem] text-[#9a734c]">Date</label>
              <div className="relative mt-2">
                <input
                  type="date"
                  value={datePart}
                  onChange={(e) => setDatePart(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pl-10 text-[1.05rem]"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#ee8c2b]">📅</span>
              </div>
            </div>
            <div>
              <label className="block text-[1.05rem] text-[#9a734c]">Time</label>
              <div className="relative mt-2">
                <input
                  type="time"
                  value={timePart}
                  onChange={(e) => setTimePart(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pl-10 text-[1.05rem]"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#ee8c2b]">🕒</span>
              </div>
            </div>
          </div>

          <label className="mt-5 block text-[1.05rem] text-[#9a734c]">Activity Type</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              onClick={() => setType("one-on-one")}
              className={`rounded-2xl border px-4 py-3 text-lg font-semibold ${type === "one-on-one" ? "border-[#ee8c2b] bg-[#ee8c2b] text-white" : "border-neutral-200 bg-white text-neutral-900"}`}
            >
              1-on-1
            </button>
            <button
              onClick={() => {
                setType("group");
                setMaxMembers((prev) => Math.max(prev, 2));
              }}
              className={`rounded-2xl border px-4 py-3 text-lg font-semibold ${type === "group" ? "border-[#ee8c2b] bg-[#ee8c2b] text-white" : "border-neutral-200 bg-white text-neutral-900"}`}
            >
              Group Activity
            </button>
          </div>

          {type === "group" && (
            <>
              <label className="mt-5 block text-[1.05rem] text-[#9a734c]">Number of Participants</label>
              <div className="relative mt-2">
                <input
                  type="number"
                  min={2}
                  value={maxMembers}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    if (nextValue === 1) {
                      setType("one-on-one");
                      setMaxMembers(2);
                      setFormError("Switched to one-on-one because group activities must have at least 2 people.");
                      return;
                    }
                    setMaxMembers(nextValue);
                    if (formError?.startsWith("Switched to one-on-one")) setFormError(null);
                  }}
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pl-10 text-[1.05rem]"
                  placeholder="How many people?"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#ee8c2b]">👥</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">Excluding you (host)</p>
            </>
          )}

          <label className="mt-5 block text-[1.05rem] text-[#9a734c]">Location</label>
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="relative mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 pl-10 text-left text-[1.05rem] text-neutral-600"
          >
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#ee8c2b]">📍</span>
            {location ? location.name : "Where are we meeting?"}
          </button>
          <p className="mt-1 text-sm text-neutral-500">Exact location is shared only after approval</p>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-lime-100/30 p-6 text-center">
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="rounded-xl bg-white px-5 py-2.5 text-base text-[#ee8c2b] shadow-sm"
            >
              🗺 Select on Map
            </button>
          </div>

          <label className="mt-5 block text-[1.05rem] text-[#9a734c]">Cost</label>
          <select
            value={costRule}
            onChange={(e) => setCostRule(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem]"
          >
            <option value="everyone_pays">Everyone pays their own</option>
            <option value="host_pays">Host will cover it</option>
            <option value="split">Split equally</option>
          </select>
        </section>

        <section>
          <h2 className="text-[2.1rem] font-bold tracking-tight text-neutral-900">Ask a Question (Optional)</h2>
          <div className="mt-3 space-y-3">
            {questions.map((q, index) => (
              <input
                placeholder="Type your question here..."
                key={index}
                value={q}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[index] = e.target.value;
                  setQuestions(updated);
                }}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-[1.05rem] text-neutral-700 placeholder:text-slate-400"
              />
            ))}
          </div>

          <button type="button" onClick={() => setQuestions([...questions, ""])} className="mt-4 text-[1.05rem] font-semibold text-[#ee8c2b]">
            + Add question
          </button>
        </section>

        {formError ? <p className="text-base text-red-600">{formError}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-[#f4f4f5]/95 px-5 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-[700px]">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-2xl bg-[#ee8c2b] py-4 text-4xl font-bold text-white shadow-md shadow-orange-400/30 disabled:opacity-70 sm:text-3xl"
          >
            {loading ? "Posting..." : "Post Activity"}
          </button>
        </div>
      </div>

      {showLocationPicker && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h2 className="text-2xl font-semibold">Choose location</h2>
            <button onClick={() => setShowLocationPicker(false)} className="text-3xl">✕</button>
          </div>

          <div className="p-4">
            <LocationPicker
              onSelect={(loc) => {
                setLocation(loc);
                setShowLocationPicker(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
