import type { HelpTopic } from "../types/help";

interface TopicQueryParams {
  route: string;
  context?: string;
  role?: string;
}

const topicCache = new Map<string, Promise<HelpTopic[]>>();

function buildCacheKey(params: TopicQueryParams): string {
  return `${params.route}|${params.context ?? ""}|${params.role ?? "Office"}`;
}

export const helpApi = {
  getTopics: (params: TopicQueryParams): Promise<HelpTopic[]> => {
    const key = buildCacheKey(params);
    const existing = topicCache.get(key);
    if (existing) {
      return existing;
    }

    const qs = new URLSearchParams();
    qs.set("route", params.route);
    if (params.context) {
      qs.set("context", params.context);
    }

    const request = fetch(`/api/help/topics?${qs.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        "X-App-Role": params.role ?? "Office",
      },
    }).then(async (res) => {
      if (!res.ok) {
        let body: unknown;
        try {
          body = await res.json();
        } catch {
          body = undefined;
        }
        throw Object.assign(new Error("Help API request failed"), {
          status: res.status,
          body,
        });
      }
      return (await res.json()) as HelpTopic[];
    });

    topicCache.set(key, request);
    return request;
  },

  getTopicById: (topicId: string, role = "Office") =>
    fetch(`/api/help/topics/${encodeURIComponent(topicId)}`, {
      headers: {
        "Content-Type": "application/json",
        "X-App-Role": role,
      },
    }).then(async (res) => {
      if (!res.ok) {
        let body: unknown;
        try {
          body = await res.json();
        } catch {
          body = undefined;
        }
        throw Object.assign(new Error("Help topic request failed"), {
          status: res.status,
          body,
        });
      }
      return (await res.json()) as HelpTopic;
    }),

  clearCache: () => {
    topicCache.clear();
  },
};
