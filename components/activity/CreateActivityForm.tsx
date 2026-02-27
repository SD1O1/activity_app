"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ui/ToastProvider";

const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker"),
  { ssr: false }
);

export default function CreateActivityForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<string[]>([""]);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"group" | "one-on-one">("group");
  const [maxMembers, setMaxMembers] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [costRule, setCostRule] = useState("everyone_pays");
  const [description, setDescription] = useState("");

  type Tag = {
    id: string;
    name: string;
  };

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagError, setTagError] = useState("");
  const [isSearchingTags, setIsSearchingTags] = useState(false);

  const [tagQuery, setTagQuery] = useState("");
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);

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
  
    const { data } = await supabase
      .from("activity_tags")
      .select("id, name")
      .ilike("name", `${value}%`)
      .limit(10);
  
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

    const cleanedQuestions = questions
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const dateTimeValue = date && time ? `${date}T${time}` : "";

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
    
    if (!dateTimeValue) {
      setFormError("Please choose date and time.");
      setLoading(false);
      return;
    }

    const startsAtMs = new Date(dateTimeValue).getTime();
    if (Number.isNaN(startsAtMs) || startsAtMs < Date.now()) {
      setFormError("Please choose a future date and time.");
      setLoading(false);
      return;
    }

    function getPublicCoords(
      lat: number,
      lng: number
    ) {
      const OFFSET = 0.003; // ~300m
    
      const randomLat =
        lat + (Math.random() - 0.5) * OFFSET;
      const randomLng =
        lng + (Math.random() - 0.5) * OFFSET;
    
      return {
        public_lat: randomLat,
        public_lng: randomLng,
      };
    }    

    const { public_lat, public_lng } = getPublicCoords(location.lat, location.lng);

    const rollbackCreate = async (activityId: string, conversationId?: string) => {
      if (conversationId) {
        await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversationId);
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
        starts_at: dateTimeValue,
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
      .insert({
        activity_id: activity.id,
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      await rollbackCreate(activity.id);
      setFormError(conversationError?.message || "Failed to initialize activity chat");
      setLoading(false);
      return;
    }

    const { error: hostParticipantError } = await supabase
      .from("conversation_participants")
      .insert({
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
      selectedTags.map((tag) => ({
        activity_id: activity.id,
        tag_id: tag.id,
      }))
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

  const resetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setType("group");
    setMaxMembers(2);
    setCostRule("everyone_pays");
    setDescription("");
    setQuestions([""]);
    setSelectedTags([]);
    setTagError("");
    setTagQuery("");
    setFilteredTags([]);
    setIsSearchingTags(false);
    setLocation(null);
    setFormError(null);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[540px] bg-[#f4f4f4] pb-8 text-[#151515]">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e4e4e4] bg-[#f4f4f4] px-5 py-4">
        <button type="button" onClick={() => router.back()} className="text-lg text-[#946736]">Cancel</button>
        <h1 className="text-3xl font-semibold leading-none tracking-[-0.03em] md:text-3xl">Create Activity</h1>
        <button type="button" onClick={resetForm} className="text-lg text-[#946736]">Reset</button>
      </div>

      <div className="space-y-8 px-5 pt-6">
        <section>
          <h2 className="text-[40px] font-semibold tracking-[-0.02em]">Category</h2>
          <div className="mt-4 rounded-2xl border border-[#d8dce2] bg-white px-4 py-4">
            <input
              value={tagQuery}
              onChange={(e) => handleTagSearch(e.target.value)}
              placeholder="Search category"
              className="w-full bg-transparent text-xl outline-none placeholder:text-[#98a0b0]"
              disabled={selectedTags.length >= 2}
            />
          </div>

          {filteredTags.length > 0 && (
            <div className="mt-2 rounded-2xl border border-[#d8dce2] bg-white shadow-sm">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    toggleTag(tag);
                    setTagQuery("");
                    setFilteredTags([]);
                  }}
                  className="block w-full px-4 py-3 text-left text-lg hover:bg-gray-100"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span key={tag.id} className="flex items-center gap-2 rounded-full bg-[#f08f26] px-3 py-1 text-sm text-white">
                {tag.name}
                <button type="button" onClick={() => removeTag(tag.id)}>✕</button>
              </span>
            ))}
          </div>
          {tagError ? <p className="mt-2 text-sm text-red-600">{tagError}</p> : null}
          {isSearchingTags && filteredTags.length === 0 && (
            <p className="mt-2 text-sm text-[#758091]">No matching tags found</p>
          )}
        </section>

        <section>
          <h2 className="text-[40px] font-semibold tracking-[-0.02em]">Details</h2>
          <label className="mt-4 block text-xl text-[#946736]">Activity Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give it a catchy title"
            className="mt-2 w-full rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-xl placeholder:text-[#98a0b0]"
          />

          <label className="mt-5 block text-xl text-[#946736]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the plan..."
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-xl placeholder:text-[#98a0b0]"
          />
        </section>

        <section>
          <h2 className="text-[40px] font-semibold tracking-[-0.02em]">Logistics</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xl text-[#946736]">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-xl" />
            </div>
            <div>
              <label className="text-xl text-[#946736]">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-xl" />
            </div>
          </div>

          <label className="mt-5 block text-xl text-[#946736]">Activity Type</label>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setType("one-on-one")}
              className={`rounded-2xl border py-4 text-xl ${type === "one-on-one" ? "border-[#f08f26] bg-[#f08f26] text-white" : "border-[#d8dce2] bg-white"}`}
            >
              1-on-1
            </button>
            <button
              type="button"
              onClick={() => {
                setType("group");
                setMaxMembers((prev) => Math.max(prev, 2));
              }}
              className={`rounded-2xl border py-4 text-xl ${type === "group" ? "border-[#f08f26] bg-[#f08f26] text-white" : "border-[#d8dce2] bg-white"}`}
            >
              Group Activity
            </button>
          </div>

          {type === "group" && (
            <>
              <label className="mt-5 block text-xl text-[#946736]">Number of Participants</label>
              <input
                type="number"
                min={2}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-xl placeholder:text-[#98a0b0]"
                placeholder="How many people?"
              />
            </>
          )}

          <label className="mt-5 block text-xl text-[#946736]">Location</label>
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="mt-2 w-full rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-left text-xl text-[#98a0b0]"
          >
            {location ? location.name : "Where are we meeting?"}
          </button>

          <div className="mt-4 flex h-36 items-center justify-center rounded-2xl bg-[#cfd6c1]">
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              className="rounded-xl bg-white px-6 py-3 text-xl font-medium text-[#f08f26]"
            >
              Select on Map
            </button>
          </div>

          <label className="mt-5 block text-xl text-[#946736]">Cost Rule</label>
          <select
            value={costRule}
            onChange={(e) => setCostRule(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-xl"
          >
            <option value="everyone_pays">Everyone pays their own</option>
            <option value="host_pays">Host will cover it</option>
            <option value="split">Split equally</option>
          </select>
        </section>

        <section>
          <h2 className="text-[40px] font-semibold tracking-[-0.02em]">Ask a Question (Optional)</h2>
          <div className="mt-4 space-y-3">
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
                className="w-full rounded-2xl border border-[#d8dce2] bg-white px-4 py-4 text-xl placeholder:text-[#98a0b0]"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setQuestions([...questions, ""])}
            className="mt-4 text-xl font-medium text-[#f08f26]"
          >
            + Add question
          </button>
        </section>
      </div>

      {showLocationPicker && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h2 className="text-lg font-semibold">
              Choose location
            </h2>
            <button
              onClick={() => setShowLocationPicker(false)}
              className="text-xl"
            >
              ✕
            </button>
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

      <div className="px-5 pt-10">
        {formError ? <p className="mb-3 text-sm text-red-600">{formError}</p> : null}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-2xl bg-[#f08f26] py-5 text-xl font-semibold text-white"
        >
          {loading ? "Creating..." : "Post Activity"}
        </button>
      </div>
    </div>
  );
}