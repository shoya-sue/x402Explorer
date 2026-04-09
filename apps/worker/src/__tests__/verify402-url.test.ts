import { describe, it, expect } from "vitest";
import { validateUrl } from "../lib/verify402.js";

describe("validateUrl (SSRF protection)", () => {
  describe("protocol checks", () => {
    it("blocks http: protocol", () => {
      const result = validateUrl("http://example.com");
      expect(result.ok).toBe(false);
      expect((result as { ok: false; error: string }).error).toContain("HTTPS");
    });

    it("allows https: protocol", () => {
      expect(validateUrl("https://example.com/api").ok).toBe(true);
    });

    it("blocks ftp: protocol", () => {
      expect(validateUrl("ftp://example.com").ok).toBe(false);
    });
  });

  describe("private host checks", () => {
    it("blocks localhost", () => {
      expect(validateUrl("https://localhost/foo").ok).toBe(false);
      expect(validateUrl("https://localhost:8080/").ok).toBe(false);
    });

    it("blocks 127.x.x.x loopback range", () => {
      expect(validateUrl("https://127.0.0.1/api").ok).toBe(false);
      expect(validateUrl("https://127.1.2.3/").ok).toBe(false);
      expect(validateUrl("https://127.255.255.255/").ok).toBe(false);
    });

    it("blocks 169.254.x.x link-local (AWS metadata endpoint)", () => {
      expect(validateUrl("https://169.254.169.254/latest/meta-data/").ok).toBe(false);
      expect(validateUrl("https://169.254.0.1/").ok).toBe(false);
    });

    it("blocks 10.x.x.x private range", () => {
      expect(validateUrl("https://10.0.0.1/").ok).toBe(false);
      expect(validateUrl("https://10.255.255.255/").ok).toBe(false);
    });

    it("blocks 192.168.x.x private range", () => {
      expect(validateUrl("https://192.168.1.1/").ok).toBe(false);
      expect(validateUrl("https://192.168.0.0/").ok).toBe(false);
    });

    it("blocks 172.16-31.x.x private range", () => {
      expect(validateUrl("https://172.16.0.1/").ok).toBe(false);
      expect(validateUrl("https://172.31.255.255/").ok).toBe(false);
    });

    it("allows 172.32.x.x (just outside private range)", () => {
      expect(validateUrl("https://172.32.0.1/").ok).toBe(true);
    });

    it("blocks IPv6 loopback ::1", () => {
      expect(validateUrl("https://[::1]/").ok).toBe(false);
    });
  });

  describe("invalid URL checks", () => {
    it("blocks empty string", () => {
      expect(validateUrl("").ok).toBe(false);
    });

    it("blocks plain hostname without scheme", () => {
      expect(validateUrl("example.com").ok).toBe(false);
    });

    it("blocks random non-URL string", () => {
      expect(validateUrl("not-a-url").ok).toBe(false);
    });
  });

  describe("valid public URLs", () => {
    it("allows standard HTTPS URL", () => {
      expect(validateUrl("https://example.com/api").ok).toBe(true);
    });

    it("allows HTTPS URL with port", () => {
      expect(validateUrl("https://api.service.com:8443/endpoint").ok).toBe(true);
    });

    it("allows HTTPS URL with query params", () => {
      expect(validateUrl("https://example.com/v1/resource?key=value").ok).toBe(true);
    });
  });
});
