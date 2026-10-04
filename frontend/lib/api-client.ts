const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, accessToken: string | undefined, options: RequestInit = {}): Promise<T> {
  if (!accessToken) throw new ApiError("You need to be signed in.", 401);

  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = result?.message;
    throw new ApiError(Array.isArray(message) ? message[0] : message || "Something went wrong.", response.status);
  }

  return response.json() as Promise<T>;
}

export interface SectionOutcome {
  category: string;
  source: "retrieved" | "default" | "skipped";
  file: string | null;
  similarity: number | null;
}

export interface PageTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export interface GenerateResponse {
  id: string;
  files: Record<string, string>;
  sections: SectionOutcome[];
  theme: PageTheme;
  referenceStyle: string | null;
}

export function getCredits(accessToken?: string) {
  return apiFetch<{ credits: number }>("/credits", accessToken);
}

export function generatePage(accessToken: string | undefined, prompt: string, referenceImage?: File) {
  if (referenceImage) {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("referenceImage", referenceImage);
    return apiFetch<GenerateResponse>("/generate", accessToken, { method: "POST", body: form });
  }
  return apiFetch<GenerateResponse>("/generate", accessToken, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export async function downloadExport(accessToken: string | undefined, id: string): Promise<Blob> {
  if (!accessToken) throw new ApiError("You need to be signed in.", 401);
  const response = await fetch(`${API_URL}/export/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new ApiError("Could not download this page.", response.status);
  return response.blob();
}

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export function updateProfile(accessToken: string | undefined, name: string, avatar?: File) {
  const form = new FormData();
  form.append("name", name);
  if (avatar) form.append("avatar", avatar);
  return apiFetch<ProfileResponse>("/profile", accessToken, { method: "PATCH", body: form });
}

// Forgot/reset password happen while signed out, so there's no access token
// to send — hit the API directly instead of going through apiFetch.
async function publicFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = result?.message;
    throw new ApiError(Array.isArray(message) ? message[0] : message || "Something went wrong.", response.status);
  }

  return response.json() as Promise<T>;
}

export function requestPasswordReset(email: string) {
  return publicFetch<{ success: true }>("/auth/forgot-password", { email });
}

export function resetPassword(token: string, password: string) {
  return publicFetch<{ success: true }>("/auth/reset-password", { token, password });
}
