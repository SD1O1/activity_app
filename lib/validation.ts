import { z, type ZodSchema } from "zod";
import { errorResponse } from "@/lib/apiResponses";

export const uuidSchema = z.string().uuid();

export async function parseJsonBody<T>(req: Request, schema: ZodSchema<T>) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return { error: errorResponse("Invalid JSON body", 400, "BAD_REQUEST") } as const;
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: errorResponse("Invalid request payload", 400, "BAD_REQUEST"),
    } as const;
  }

  return { data: parsed.data } as const;
}