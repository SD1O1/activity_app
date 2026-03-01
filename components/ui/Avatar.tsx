import { HTMLAttributes } from "react";
import clsx from "clsx";
import Image from "next/image";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  verified?: boolean;
}

export function Avatar({ className, size = "md", src, alt = "Avatar", verified = false, children, ...props }: AvatarProps) {
  return (
    <div className={clsx("relative inline-flex", className)} {...props}>
      <div
        className={clsx(
          "relative overflow-hidden rounded-full bg-gray-200 text-gray-600 flex items-center justify-center",
          size === "sm" && "h-8 w-8 text-xs",
          size === "md" && "h-10 w-10 text-sm",
          size === "lg" && "h-12 w-12 text-base",
        )}
      >
        {src ? <Image src={src} alt={alt} fill sizes="48px" className="object-cover" /> : children}
      </div>
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-black text-[10px] leading-none text-white">
          ✓
        </span>
      )}
    </div>
  );
}
