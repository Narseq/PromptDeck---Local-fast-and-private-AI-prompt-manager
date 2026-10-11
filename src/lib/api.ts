import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AppError } from "./errors";

type RouteContext<P> = { params: Promise<P> };

/** Wraps a route handler: converts thrown errors into consistent JSON error responses. */
export function route<P = Record<string, never>>(
  handler: (request: Request, params: P) => Promise<Response> | Response,
) {
  return async (request: Request, context: RouteContext<P>): Promise<Response> => {
    try {
      return await handler(request, await context.params);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
          .join("; ");
        return NextResponse.json({ error: message }, { status: 400 });
      }
      if (error instanceof AppError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error(error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON", 400);
  }
  return schema.parse(body);
}

export const json = <T>(data: T, status = 200) => NextResponse.json(data, { status });
