"use client";

import { useEffect, useRef, useState } from "react";

type PhotoVerificationSlideProps = {
  onCapture: (blob: Blob) => void;
};

export default function PhotoVerificationSlide({
  onCapture,
}: PhotoVerificationSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCameraAndRecord = async () => {
      try {
        setError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm",
        });

        mediaRecorderRef.current = mediaRecorder;
        recordedChunks.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunks.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks.current, {
            type: "video/webm",
          });

          setIsRecording(false);
          onCapture(blob);

          // Stop camera
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();

        setTimeout(() => {
          mediaRecorder.stop();
        }, 3000);
      } catch (err) {
        console.error("Camera access failed", err);
        setError("Unable to access camera. Please allow camera permissions and retry.");
      }
    };

    startCameraAndRecord();
  }, [onCapture]);

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <h2 className="text-lg font-semibold mb-2">
        Verify your identity
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        {isRecording
          ? "Hold still and look at the camera"
          : "Verification recorded successfully"}
      </p>

      {isRecording && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg mb-3"
        />
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-xs text-gray-500">This video is used only for identity verification and is never public.</p>

      {!isRecording && (
        <p className="text-green-600 font-semibold text-sm">
          ✓ We’ll verify this shortly
        </p>
      )}
    </div>
  );
}