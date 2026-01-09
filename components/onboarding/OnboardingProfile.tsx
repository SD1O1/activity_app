"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCityFromDevice } from "@/lib/location";
import { useRouter } from "next/navigation";
import { detectCountryCode } from "@/lib/country";

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
  const [otpLoading, setOtpLoading] = useState(false);
  const router = useRouter();
  const fullPhone = `${form.countryCode}${form.phone}`;

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
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
        return (
          form.phone.length === 10 &&
          form.countryCode.length > 0
        );
      case 1:
        return form.phoneVerified === true;
      case 2:
        return form.name.trim().length > 0;
      case 3:
      {
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
      setForm((prev) => ({ ...prev, city }));
    } catch {
      alert("Unable to access location. Enter city manually.");
    }
  };

  const handlePhotoUpload = async (file: File) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const ext = file.name.split(".").pop();
    const path = `${auth.user.id}.${ext}`;

    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });

    if (error) {
      console.error(error);
      return;
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(path);

    setForm((prev) => ({ ...prev, photo: data.publicUrl }));
  };

  const uploadVerificationVideo = async () => {
    if (!form.verificationSelfie || !userId) return;
  
    const path = `${userId}/${Date.now()}.webm`;
  
    const { error } = await supabase.storage
      .from("verification-photos")
      .upload(path, form.verificationSelfie);
  
    if (error) {
      console.error("Verification upload failed", error);
      return;
    }
  
    await supabase
      .from("profiles")
      .update({
        verification_status: "pending",
        verification_video_path: path,
      })
      .eq("id", userId);
  };  

  const handleSubmit = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { error: profileError } = await supabase
  .from("profiles")
  .update({
    name: form.name,
    dob: form.dob,
    bio: form.bio,
    avatar_url: form.photo || null,
    city: form.city || null,
    phone: fullPhone,
    phone_verified: form.phoneVerified,
    interests: form.interests,
  })
  .eq("id", auth.user.id);

  if (profileError) {
    console.error("Profile update failed:", profileError);
    alert("Failed to save profile. Please try again.");
    return;
  }  

    await uploadVerificationVideo();
    router.replace("/profile");
  };  

  /* -------------------- render -------------------- */

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold mb-4">
        Profile Onboarding
      </h1>

      {step === 0 && (
        <PhoneSlide
          countryCode={form.countryCode}
          phone={form.phone}
          onCountryCodeChange={(code) =>
            setForm((p) => ({ ...p, countryCode: code }))
          }
          onPhoneChange={(phone) =>
            setForm((p) => ({ ...p, phone }))
          }
        />
      )}

      {form.phone.length > 0 && form.phone.length !== 10 && (
        <p className="text-xs text-red-500 mt-1">
          Enter a valid 10-digit phone number
        </p>
      )}

      {step === 1 && (
        <PhoneOtpSlide
          otp={otp}
          onChange={setOtp}
          loading={otpLoading}
          onVerify={() => {
            if (otp.length < 4) return alert("Invalid code");
            setForm((p) => ({ ...p, phoneVerified: true }));
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <NameSlide
          value={form.name}
          onChange={(name) =>
            setForm({ ...form, name })
          }
        />
      )}

      {step === 3 && (
        <DobSlide
          value={form.dob}
          onChange={(dob) =>
            setForm({ ...form, dob })
          }
        />
      )}

      {step === 4 && (
        <BioSlide
          value={form.bio}
          onChange={(bio) =>
            setForm({ ...form, bio })
          }
        />
      )}

      {step === 5 && (
        <InterestSlide
          value={form.interests}
          onChange={(interests) =>
            setForm({ ...form, interests })
          }
        />
      )}

      {step === 6 && (
        <LocationSlide
          city={form.city}
          onCityChange={(city) =>
            setForm({ ...form, city })
          }
          onUseLocation={handleUseLocation}
        />
      )}

      {step === 7 && (
        <PhotoSlide
          value={form.photo}
          onSelectFile={handlePhotoUpload}
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

      <p className="text-sm text-gray-500 mt-4">
        Step {step + 1} of {TOTAL_STEPS}
      </p>

      <div className="mt-6 flex w-full max-w-sm justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-gray-600"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < TOTAL_STEPS - 1 ? (
          <button
            disabled={!isStepValid()}
            onClick={() => setStep((s) => s + 1)}
            className={`text-sm font-semibold ${
              isStepValid()
                ? "text-black"
                : "text-gray-400 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="text-sm font-semibold text-black"
          >
            Save & Continue
          </button>
        )}
      </div>
    </div>
  );
}