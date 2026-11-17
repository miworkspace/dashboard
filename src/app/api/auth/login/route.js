import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request) {
  let credentials;

  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }

  const email = credentials?.email;
  const password = credentials?.password;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  if (!API_URL) {
    return NextResponse.json(
      { message: "API URL is not configured" },
      { status: 500 },
    );
  }

  let upstream;

  try {
    upstream = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Authentication service is unavailable" },
      { status: 502 },
    );
  }

  const result = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      { message: result.message || "Login failed. Try again." },
      { status: upstream.status },
    );
  }

  if (!result.token || !result.user) {
    return NextResponse.json(
      { message: "Authentication service returned an invalid response" },
      { status: 502 },
    );
  }

  // Extract JWT expiration
  let expiresAt;

  try {
    const payload = JSON.parse(
      Buffer.from(result.token.split(".")[1], "base64url").toString("utf8"),
    );

    if (!payload.exp) {
      throw new Error("Missing token expiration");
    }

    expiresAt = payload.exp * 1000;

    if (expiresAt <= Date.now()) {
      throw new Error("Token already expired");
    }
  } catch {
    return NextResponse.json(
      { message: "Invalid or expired authentication token" },
      { status: 502 },
    );
  }

  // Create response and set HttpOnly cookie
  const response = NextResponse.json({
    success: true,
    user: result.user,
    token: result.token,
    expiresAt,
  });

  response.cookies.set("accessToken", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return response;
}
