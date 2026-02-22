import { NextResponse } from "next/server";

export async function safeJson<T>(req: Request): Promise<{
  data?: T;
  errorResponse?: NextResponse;
}> {
  try {
    const data = (await req.json()) as T;
    return { data };
  } catch {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}