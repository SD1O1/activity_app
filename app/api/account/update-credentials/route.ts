import { NextResponse } from "next/server";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabaseServer";

type RequestBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const password =
      typeof body.password === "string" ? body.password : undefined;

    if (!email && !password) {
      return NextResponse.json(
        { success: false, error: "Provide email and/or password." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();
    const admin = createSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      ...(email ? { email } : {}),
      ...(password ? { password } : {}),
    });

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message || "Failed to update credentials." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("update-credentials failed", { error });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}