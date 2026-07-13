import type {
  GoalScenario,
  PlayerPreset,
  Team,
  WinProbabilityRequest,
  WinProbabilityResponse,
  XgRewindRequest,
  XgRewindResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API 요청 실패 (${res.status}): ${path}`);
  }
  return res.json();
}

export function getHealth(): Promise<{ status: string }> {
  return request("/health");
}

export function getTeams(): Promise<Team[]> {
  return request("/api/teams");
}

export function getPlayerPresets(): Promise<PlayerPreset[]> {
  return request("/api/players/presets");
}

export function postWinProbability(body: WinProbabilityRequest): Promise<WinProbabilityResponse> {
  return request("/api/win-probability", { method: "POST", body: JSON.stringify(body) });
}

export function getGoalScenarios(): Promise<GoalScenario[]> {
  return request("/api/scenarios/goal");
}

export function postXgRewind(body: XgRewindRequest): Promise<XgRewindResponse> {
  return request("/api/xg/rewind", { method: "POST", body: JSON.stringify(body) });
}
