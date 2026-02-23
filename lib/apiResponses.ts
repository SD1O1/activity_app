import { NextResponse } from "next/server";

export function successResponse<T>(data?: T, status = 200) {
  if (typeof data === "undefined") {
    return NextResponse.json({ success: true }, { status });
  }

  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  error: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}