import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditApiUnavailableError, listAuditEvents, statusLabel } from "./api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("audit API boundary", () => {
  it("fails closed when no configured backend origin exists", async () => {
    await expect(listAuditEvents(null, { limit: 10 })).rejects.toBeInstanceOf(AuditApiUnavailableError);
  });

  it("labels only the documented projection statuses", () => {
    expect(statusLabel("canonical")).toBe("Canonical");
    expect(statusLabel("unfinalized")).toBe("Unfinalized");
    expect(statusLabel("uncertain")).toBe("Uncertain");
  });

  it("accepts only the sanitized contract and omits browser credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        projection_only: true,
        events: [{
          event_id: "event-1",
          chain_id: 31337,
          contract_address: "0x1111111111111111111111111111111111111111",
          transaction_hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
          log_index: 0,
          block_number: 1,
          event_name: "IdentityRegistered",
          projection_status: "canonical",
        }],
      }),
    });
    globalThis.fetch = fetchMock;

    const events = await listAuditEvents("https://api.example.invalid", { limit: 10, projectionStatus: "canonical" });

    expect(events).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.invalid/v1/audit?limit=10&projection_status=canonical",
      expect.objectContaining({ credentials: "omit" }),
    );
  });
});
