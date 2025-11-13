import { QueryClient } from "@tanstack/react-query";
import { getAuthToken } from "./auth";

async function handleRequest(url: string, options?: RequestInit) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...options?.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    const message = await response.text();
    throw new Error(message || `${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  url: string,
  data?: any
) {
  const options: RequestInit = {
    method,
  };

  if (data) {
    if (data instanceof FormData) {
      options.body = data;
    } else if (method !== "GET") {
      options.body = JSON.stringify(data);
    }
  }

  return handleRequest(url, options);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return handleRequest(url);
      },
      staleTime: 1000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
