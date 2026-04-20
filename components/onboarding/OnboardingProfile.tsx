"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCityFromDevice } from "@/lib/location";
import { useRouter } from "next/navigation";
import { detectCountryCode } from "@/lib/country";
import { useToast } from "@/components/ui/ToastProvider";
import { generateUsernameFromName } from "../../lib/username";

import PhoneSlide from "@/components/onboarding/slides/PhoneSlide";
import PhoneOtpSlide from "@/components/onboarding/slides/PhoneOtpSlide";
import NameSlide from "@/components/onboarding/slides/NameSlide";
import DobSlide from "@/components/onboarding/slides/DobSlide";
import BioSlide from "@/components/onboarding/slides/BioSlide";
import InterestSlide from "@/components/onboarding/slides/InterestSlide";
import LocationSlide from "@/components/onboarding/slides/LocationSlide";
import PhotoSlide from "@/components/onboarding/slides/PhotoSlide";
import PhotoVerificationSlide from "@/components/onboarding/slides/PhotoVerificationSlide";

const TOTAL_STEPS = 9;
const PROFILE_PHOTOS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROFILE_PHOTOS_BUCKET ?? "profile-photos";
const VERIFICATION_PHOTOS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_VERIFICATION_PHOTOS_BUCKET ??
  "verification-photos";

  function normalizeCity(city: string): string {
    const trimmed = city.trim();
    if (!trimmed) return "";
  
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }
  
export default function OnboardingProfile() {
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: "",
    dob: "",
    bio: "",
    interests: [] as string[],
    city: "",
    photo: null as string | null,
    phone: "",
    countryCode: "+91",
    phoneVerified: false,
    verificationSelfie: null as Blob | null,
  });

  const [otp, setOtp] = useState("");
  const [otpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const fullPhone = `${form.countryCode}${form.phone}`;

  const [userId, setUserId] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      } else {
        setGlobalError("You are not signed in. Please sign in again to continue onboarding.");
      }
    });
  }, []);

  useEffect(() => {
    const initCountry = async () => {
      const code = await detectCountryCode();
      setForm((p) => ({ ...p, countryCode: code }));
    };

    initCountry();
  }, []);

  /* -------------------- helpers -------------------- */

  const isStepValid = () => {
    switch (step) {
      case 0:
        return form.phone.length === 10 && form.countryCode.length > 0;
      case 1:
        return form.phoneVerified === true;
      case 2:
        return form.name.trim().length > 0;
      case 3: {
        if (!form.dob) return false;

        const birthDate = new Date(form.dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return age >= 18;
      }
      case 4:
        return form.bio.trim().length > 0;
      case 5:
        return form.interests.length >= 5 && form.interests.length <= 10;
      case 6:
        return form.city.trim().length > 0;
      case 7:
        return !!form.photo;
      case 8:
        return !!form.verificationSelfie;
      default:
        return false;
    }
  };

  const handleUseLocation = async () => {
    try {
      const { city } = await getCityFromDevice();
      setForm((prev) => ({ ...prev, city: normalizeCity(city)  }));
    } catch {
      setGlobalError("Unable to access location. Enter city manually.");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploadError(null);
    setGlobalError(null);
    setPhotoUploading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth?.user) {
        const message =
          "You are not signed in. Please sign in again before uploading a photo.";
        setPhotoUploadError(message);
        setGlobalError(message);
        setSubmitting(false);
        return;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${auth.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_PHOTOS_BUCKET)
        .upload(path, file, { upsert: true });

      if (uploadError) {
        setPhotoUploadError(
          uploadError.message || "Photo upload failed. Please try again."
        );
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path);

      if (!publicUrl) {
        setPhotoUploadError(
          "Photo uploaded, but we could not generate its URL. Please retry."
        );
        return;
      }

      setForm((prev) => ({ ...prev, photo: publicUrl }));
    } catch {
      setPhotoUploadError("Unexpected upload error. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const uploadVerificationVideo = async () => {
    if (!form.verificationSelfie || !userId) return;

    const path = `${userId}/${Date.now()}.webm`;

    const { error } = await supabase.storage
      .from(VERIFICATION_PHOTOS_BUCKET)
      .upload(path, form.verificationSelfie);

    if (error) {
      console.error("Verification upload failed", error);
      return;
    }

    await supabase
      .from("profile_private")
      .update({
        verification_status: "pending",
        verification_video_path: path,
      })
      .eq("id", userId);
  };

  const handleSubmit = async () => {
    setGlobalError(null);
    setPhoneError(null);
    setSubmitting(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setGlobalError("You are not signed in. Please sign in again to save your profile.");
      setSubmitting(false);
      return;
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", auth.user.id)
      .maybeSingle();

    const username =
      existingProfile?.username ??
      generateUsernameFromName(form.name || auth.user.email || "user", auth.user.id);

    const payload = {
      id: auth.user.id,
      name: form.name,
      username,
      dob: form.dob,
      bio: form.bio,
      avatar_url: form.photo || null,
      city: form.city || null,
      phone_verified: form.phoneVerified,
      interests: form.interests,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (profileError) {
      console.error("Profile upsert failed:", profileError);
      setGlobalError(
        profileError.message ||
          "Failed to save your profile. Please try again."
      );
      setSubmitting(false);
      return;
    }

    const { error: privateProfileError } = await supabase
      .from("profile_private")
      .upsert(
        {
          id: auth.user.id,
          phone: fullPhone,
          phone_verified: form.phoneVerified,
        },
        { onConflict: "id" }
      );

    if (privateProfileError) {
      if (
        privateProfileError.code === "23505" ||
        privateProfileError.message?.includes("profile_private_phone_unique")
      ) {
        setPhoneError(
          "This phone number is already associated with another account."
        );
        setStep(0);
        setSubmitting(false);
        return;
      }

      console.error("Private profile upsert failed:", privateProfileError);
      setGlobalError(
        privateProfileError.message ||
          "Failed to save your private profile details. Please try again."
      );
      setSubmitting(false);
      return;
    }

    await uploadVerificationVideo();
    showToast("Profile saved successfully", "success");
    setSubmitting(false);
    router.replace("/profile");
  };

  /* -------------------- render -------------------- */

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-[1.75rem] border border-orange-100/80 bg-white/95 p-6 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.55)] sm:p-7">
      <h1 className="mb-4 text-center text-2xl font-bold tracking-tight text-slate-900">Profile Onboarding</h1>

      {globalError ? (
        <p className="mb-3 text-center text-sm text-red-600" role="alert">
          {globalError}
        </p>
      ) : null}

      {step === 0 && (
        <PhoneSlide
          countryCode={form.countryCode}
          phone={form.phone}
          error={phoneError ?? undefined}
          onCountryCodeChange={(code) =>
            setForm((p) => ({ ...p, countryCode: code }))
          }
          onPhoneChange={(phone) => {
            setPhoneError(null);
            setForm((p) => ({ ...p, phone }));
          }}
        />
      )}

      {step === 1 && (
        <PhoneOtpSlide
          otp={otp}
          onChange={setOtp}
          loading={otpLoading}
          error={otpError}
          onVerify={() => {
            if (otp.length < 4) {
              setOtpError("Please enter a valid code.");
              return;
            }
            setOtpError(null);
            setForm((p) => ({ ...p, phoneVerified: true }));
            showToast("Phone verified", "success");
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <NameSlide value={form.name} onChange={(name) => setForm({ ...form, name })} />
      )}

      {step === 3 && (
        <DobSlide value={form.dob} onChange={(dob) => setForm({ ...form, dob })} />
      )}

      {step === 4 && (
        <BioSlide value={form.bio} onChange={(bio) => setForm({ ...form, bio })} />
      )}

      {step === 5 && (
        <InterestSlide
          value={form.interests}
          onChange={(interests) => setForm({ ...form, interests })}
        />
      )}

      {step === 6 && (
        <LocationSlide
          city={form.city}
          onCityChange={(city) =>
            setForm({ ...form, city: normalizeCity(city) })
          }
          onUseLocation={handleUseLocation}
        />
      )}

      {step === 7 && (
        <PhotoSlide
          value={form.photo}
          onSelectFile={handlePhotoUpload}
          uploading={photoUploading}
          error={photoUploadError}
        />
      )}

      {step === 8 && (
        <PhotoVerificationSlide
          onCapture={(blob) =>
            setForm((p) => ({
              ...p,
              verificationSelfie: blob,
            }))
          }
        />
      )}

<p className="mt-5 text-center text-sm text-slate-500">Step {step + 1} of {TOTAL_STEPS}</p>

<div className="mt-6 flex w-full justify-between">
  {step > 0 ? (
    <button
      onClick={() => setStep((s) => s - 1)}
      className="rounded-full border border-orange-200 bg-orange-50/70 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
    >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < TOTAL_STEPS - 1 ? (
          <button
            disabled={!isStepValid() || photoUploading}
            onClick={() => setStep((s) => s + 1)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
              !isStepValid() || photoUploading
                ? "cursor-not-allowed bg-orange-100 text-slate-400"
                : "bg-[#f97316] text-white hover:bg-[#ea580c]"
            }`}
          >
            {photoUploading && step === 7 ? "Uploading…" : "Next"}
          </button>
        ) : (
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-full bg-[#f97316] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:bg-orange-100 disabled:text-slate-400"
          >
            {submitting ? "Saving..." : "Save & Continue"}
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
