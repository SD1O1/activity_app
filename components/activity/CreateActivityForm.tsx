"use client";

import { useState, useEffect } from "react";
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

  const [questions, setQuestions] = useState<string[]>([
    "",
  ]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"group" | "one-on-one">("group");
  const [maxMembers, setMaxMembers] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [costRule, setCostRule] = useState("everyone_pays");
  const [description, setDescription] = useState("");

  type Tag = {
    id: string;
    name: string;
  };
  
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
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
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
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
  
  useEffect(() => {
    supabase
      .from("activity_tags")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setAvailableTags(data);
      });
  }, []);  

  const toggleTag = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
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
    .map(q => q.trim())
    .filter(q => q.length > 0);

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
    
    if (!date) {
      setFormError("Please choose date and time.");
      setLoading(false);
      return;
    }

    const startsAtMs = new Date(date).getTime();
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
        starts_at: date,
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
      await supabase.from("activities").delete().eq("id", activity.id);
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
      await supabase.from("conversations").delete().eq("id", conversation.id);
      await supabase.from("activities").delete().eq("id", activity.id);
      setFormError(hostParticipantError.message || "Failed to initialize activity chat participants");
      setLoading(false);
      return;
    }

    if (selectedTags.length === 0) {
      await supabase.from("conversation_participants").delete().eq("conversation_id", conversation.id);
      await supabase.from("conversations").delete().eq("id", conversation.id);
      await supabase.from("activities").delete().eq("id", activity.id);
      setFormError("Please select at least one activity tag");
      setLoading(false);
      return;
    }

    const { error: tagInsertError } = await supabase.from("activity_tag_relations").insert(
      selectedTags.map(tag => ({
        activity_id: activity.id,
        tag_id: tag.id,
      }))
    );

    if (tagInsertError) {
      await supabase.from("conversation_participants").delete().eq("conversation_id", conversation.id);
      await supabase.from("conversations").delete().eq("id", conversation.id);
      await supabase.from("activities").delete().eq("id", activity.id);
      setFormError(tagInsertError.message || "Failed to link activity tags");
      setLoading(false);
      return;
    }

    setLoading(false);

    showToast("Activity created successfully", "success");
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
      <input
        value={tagQuery}
        onChange={(e) => handleTagSearch(e.target.value)}
        placeholder="Search activity tags…"
        className="mt-2 w-full rounded-xl border px-4 py-3"
        disabled={selectedTags.length >= 2}
      />

      {filteredTags.length > 0 && (
        <div className="mt-2 rounded-xl border bg-white shadow-sm">
          {filteredTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                toggleTag(tag);
                setTagQuery("");
                setFilteredTags([]);
              }}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2 flex-wrap">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full bg-black px-3 py-1 text-xs text-white"
          >
            {tag.name}
            <button onClick={() => removeTag(tag.id)}>✕</button>
          </span>
        ))}
      </div>

      {tagError ? <p className="mt-2 text-xs text-red-600">{tagError}</p> : null}

      {isSearchingTags && filteredTags.length === 0 && (
        <div className="mt-2 rounded-xl border bg-white px-4 py-3 text-sm text-gray-500">
          No matching tags found
        </div>
      )}

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
            onClick={() => {
              setType("group");
              setMaxMembers((prev) => Math.max(prev, 2));
            }}
            className={`rounded-xl border py-3 ${
              type === "group" ? "bg-black text-white" : ""
            }`}
          >
            Group
          </button>
        </div>
      </div>

      {type === "group" && (
        <div className="mb-5">
          <label className="text-sm font-medium">
            How many people are you looking for?
          </label>

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
              if (formError?.startsWith("Switched to one-on-one")) {
                setFormError(null);
              }
            }}
            className="mt-2 w-full rounded-xl border px-4 py-3"
            placeholder="e.g. 5"
          />

          <p className="mt-1 text-xs text-gray-500">
            Excluding you (host)
          </p>
        </div>
      )}


      {/* Location */}
      <div className="mb-5">
        <label className="text-sm font-medium">
          Location
        </label>

        <button
          type="button"
          onClick={() => setShowLocationPicker(true)}
          className="mt-2 w-full rounded-xl border px-4 py-3 text-left"
        >
          {location ? location.name : "Choose location"}
        </button>

        <p className="mt-1 text-xs text-gray-500">
          Exact location is shared only after approval
        </p>
      </div>

      {/* Date & time */}
      <div className="mb-5">
        <label className="text-sm font-medium">Date & Time</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
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

      {formError ? <p className="mb-3 text-sm text-red-600">{formError}</p> : null}

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