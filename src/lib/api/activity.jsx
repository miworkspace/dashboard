import { apiRequest } from "../api";

export const activityApi = {
  async getActivities(filters = {}) {
    const data = await apiRequest("/activity?limit=200");
    let activities = data.activities || [];

    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      activities = activities.filter((item) =>
        [
          item.user,
          item.email,
          item.action,
          item.module,
          item.record,
          item.details,
        ].some((value) => value?.toLowerCase().includes(query)),
      );
    }

    if (filters.module && filters.module.toLowerCase() !== "all") {
      activities = activities.filter(
        (item) => item.module?.toLowerCase() === filters.module.toLowerCase(),
      );
    }

    if (filters.user && filters.user !== "all") {
      activities = activities.filter((item) => item.user === filters.user);
    }

    return activities;
  },

  async clearActivities() {
    return apiRequest("/activity", { method: "DELETE" });
  },
};
