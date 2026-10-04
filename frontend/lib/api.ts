const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type AuthMode = "login" | "signup";

export interface AuthPayload {
  name?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function authenticate(mode: AuthMode, payload: AuthPayload) {
  const response = await fetch(`${API_URL}/auth/${mode}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as
    | AuthResponse
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message = result && "message" in result ? result.message : null;
    throw new Error(
      Array.isArray(message)
        ? message[0]
        : message || "We could not complete that request.",
    );
  }

  return result as AuthResponse;
}
