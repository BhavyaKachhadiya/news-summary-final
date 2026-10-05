import ipaddr from "ipaddr.js";
import dns from "dns/promises";
import { ALLOWED_DOMAINS } from "@/config/feeds";

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  url?: URL;
}

const BLOCKED_PROTOCOLS = new Set(["file:", "ftp:", "gopher:", "data:", "javascript:"]);

/**
 * Checks whether an IP address is private, loopback, link-local, multicast, or reserved.
 */
export function isPrivateIp(ipString: string): boolean {
  try {
    const addr = ipaddr.parse(ipString);
    const range = addr.range();

    const privateRanges = [
      "loopback",
      "private",
      "linkLocal",
      "uniqueLocal",
      "carrierGradeNat",
      "reserved",
      "multicast",
      "broadcast",
    ];

    return privateRanges.includes(range);
  } catch {
    return true; // If IP cannot be parsed, treat as unsafe
  }
}

/**
 * Validates whether a URL has safe protocol and belongs to allowed domains.
 */
export function validateUrl(urlStr: string): UrlValidationResult {
  try {
    const parsed = new URL(urlStr);

    if (BLOCKED_PROTOCOLS.has(parsed.protocol) || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      return {
        isValid: false,
        error: `Disallowed protocol: ${parsed.protocol}`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, IP formats, internal hosts explicitly
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    ) {
      return {
        isValid: false,
        error: `Host ${hostname} is blocked (internal/loopback)`,
      };
    }

    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return {
        isValid: false,
        error: `Domain ${hostname} is not in allowed domains list`,
      };
    }

    return { isValid: true, url: parsed };
  } catch (err: unknown) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : "Invalid URL",
    };
  }
}

/**
 * Resolves the hostname via DNS and checks whether any resolved IP is private/internal.
 */
export async function assertSafeDns(hostname: string): Promise<boolean> {
  try {
    // If hostname is already an IP, parse directly
    if (ipaddr.isValid(hostname)) {
      return !isPrivateIp(hostname);
    }

    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return false;
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  maxSizeBytes?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  status: number;
  headers: Headers;
  text: string;
  url: string;
}

/**
 * Safely fetches a URL by manually handling redirects and validating each target against SSRF.
 * Also enforces response body size limits.
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const {
    maxRedirects = 3,
    maxSizeBytes = 2 * 1024 * 1024, // 2MB
    timeoutMs = 10000,
    headers = {},
  } = options;

  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const validation = validateUrl(currentUrl);
    if (!validation.isValid || !validation.url) {
      throw new Error(`SSRF validation failed: ${validation.error}`);
    }

    const isSafeIp = await assertSafeDns(validation.url.hostname);
    if (!isSafeIp) {
      throw new Error(`DNS resolution blocked for host: ${validation.url.hostname}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        headers,
        redirect: "manual", // Do NOT follow redirects automatically
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Handle redirect status codes (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new Error(`Exceeded maximum redirect limit (${maxRedirects})`);
        }

        const location = response.headers.get("location");
        if (!location) {
          throw new Error(`Redirect response missing Location header`);
        }

        // Resolve relative redirect against current URL
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        return {
          status: response.status,
          headers: response.headers,
          text: "",
          url: currentUrl,
        };
      }

      // Check Content-Length header if present
      const contentLengthStr = response.headers.get("content-length");
      if (contentLengthStr) {
        const contentLength = parseInt(contentLengthStr, 10);
        if (!isNaN(contentLength) && contentLength > maxSizeBytes) {
          throw new Error(
            `Response content length ${contentLength} bytes exceeds limit of ${maxSizeBytes} bytes`
          );
        }
      }

      // Stream read with strict byte size limit
      if (!response.body) {
        const text = await response.text();
        return {
          status: response.status,
          headers: response.headers,
          text,
          url: currentUrl,
        };
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          totalBytes += value.length;
          if (totalBytes > maxSizeBytes) {
            reader.cancel();
            throw new Error(
              `Response size exceeded maximum allowed limit of ${maxSizeBytes} bytes`
            );
          }
          chunks.push(value);
        }
      }

      const concatenated = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        concatenated.set(chunk, offset);
        offset += chunk.length;
      }

      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(concatenated);

      return {
        status: response.status,
        headers: response.headers,
        text,
        url: currentUrl,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      throw err;
    }
  }

  throw new Error(`Exceeded maximum redirect limit (${maxRedirects})`);
}
