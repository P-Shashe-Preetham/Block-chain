const projectionStatuses = ["canonical", "unfinalized", "uncertain"];
export class AuditApiUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuditApiUnavailableError";
    }
}
export function apiBaseUrl() {
    const candidate = import.meta.env.VITE_API_BASE_URL?.trim();
    if (!candidate)
        return null;
    return candidate.replace(/\/$/, "");
}
export async function listAuditEvents(baseUrl, filters) {
    if (!baseUrl) {
        throw new AuditApiUnavailableError("No API base URL is configured. The console is intentionally showing no illustrative chain data.");
    }
    const query = new URLSearchParams({ limit: String(filters.limit) });
    if (filters.projectionStatus)
        query.set("projection_status", filters.projectionStatus);
    const response = await fetch(`${baseUrl}/v1/audit?${query.toString()}`, {
        headers: { Accept: "application/json" },
        credentials: "omit",
    });
    if (!response.ok) {
        throw new AuditApiUnavailableError(`The audit projection is unavailable (${response.status}). Authentication and projection readiness remain fail closed.`);
    }
    const payload = await response.json();
    if (!isAuditResponse(payload)) {
        throw new AuditApiUnavailableError("The audit response did not match the sanitized projection contract.");
    }
    return payload.events;
}
export function statusLabel(status) {
    return status === "canonical" ? "Canonical" : status === "unfinalized" ? "Unfinalized" : "Uncertain";
}
function isAuditResponse(value) {
    if (!isRecord(value) || value.projection_only !== true || !Array.isArray(value.events))
        return false;
    return value.events.every(isAuditEvent);
}
function isAuditEvent(value) {
    if (!isRecord(value))
        return false;
    return typeof value.event_id === "string" && value.event_id.length > 0
        && isPositiveInteger(value.chain_id)
        && isHex(value.contract_address, 40)
        && isHex(value.transaction_hash, 64)
        && isNonnegativeInteger(value.log_index)
        && isNonnegativeInteger(value.block_number)
        && typeof value.event_name === "string" && value.event_name.length > 0
        && projectionStatuses.includes(value.projection_status);
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isPositiveInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value > 0;
}
function isNonnegativeInteger(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
function isHex(value, digits) {
    return typeof value === "string" && new RegExp(`^0x[0-9a-fA-F]{${digits}}$`).test(value);
}
