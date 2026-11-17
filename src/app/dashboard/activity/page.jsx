"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CircleAlert,
  Clock3,
  Eye,
  FilePlus2,
  LogIn,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { getAuthUser } from "@/lib/api";
import { activityApi } from "@/lib/api/activity";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

const REFRESH_INTERVAL = 5000;

const ACTION_STYLES = {
  "Signed In": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Viewed Page": "bg-blue-50 text-blue-700 ring-blue-600/20",
  Created: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Updated: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Deleted: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

function ActionIcon({ activity }) {
  if (activity.type === "login") return <LogIn className="h-4 w-4" />;
  if (activity.type === "page_view") return <Eye className="h-4 w-4" />;
  if (activity.action === "Created") return <FilePlus2 className="h-4 w-4" />;
  if (activity.action === "Deleted") return <Trash2 className="h-4 w-4" />;
  return <ShieldCheck className="h-4 w-4" />;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(getAuthUser()?.role === "admin");
  }, []);

  const loadActivities = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);

    try {
      const result = await activityApi.getActivities();
      setActivities(result);
      setLastUpdated(new Date());
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load activity history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
    const timer = window.setInterval(
      () => loadActivities(true),
      REFRESH_INTERVAL,
    );

    return () => window.clearInterval(timer);
  }, [loadActivities]);

  const modules = useMemo(
    () =>
      [...new Set(activities.map((item) => item.module).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activities.filter((item) => {
      if (moduleFilter !== "all" && item.module !== moduleFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (!query) return true;

      return [
        item.user,
        item.email,
        item.role,
        item.action,
        item.module,
        item.record,
        item.details,
        item.path,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [activities, moduleFilter, search, typeFilter]);

  const handleClear = async () => {
    if (!window.confirm("Permanently clear all activity history?")) return;

    try {
      await activityApi.clearActivities();
      setActivities([]);
      setError("");
    } catch (clearError) {
      setError(clearError.message || "Could not clear activity history.");
    }
  };

  const actionCount = activities.filter(
    (item) => item.type === "mutation",
  ).length;
  const pageViewCount = activities.filter(
    (item) => item.type === "page_view",
  ).length;
  const loginCount = activities.filter((item) => item.type === "login").length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Activity & Audit" }]} />

      <PageHeader
        title="Activity & Audit"
        description="A live timeline of sign-ins, pages visited, and changes made across your workspace."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live · 5s refresh
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadActivities(true)}
              disabled={refreshing}
            >
              Refresh
            </Button>
            {isAdmin && activities.length > 0 && (
              <Button
                variant="dangerOutline"
                size="sm"
                icon={Trash2}
                onClick={handleClear}
              >
                Clear history
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Recorded changes",
            count: actionCount,
            icon: ShieldCheck,
            color: "text-violet-600 bg-violet-50",
          },
          {
            label: "Pages viewed",
            count: pageViewCount,
            icon: Eye,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Successful sign-ins",
            count: loginCount,
            icon: LogIn,
            color: "text-emerald-600 bg-emerald-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {stat.count}
              </p>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Recent activity</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {lastUpdated
                ? `Last synced ${lastUpdated.toLocaleTimeString()}`
                : "Waiting for activity"}
              {refreshing && " · syncing"}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_170px]">
            <Input
              aria-label="Search activities"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people, pages, actions..."
              icon={Search}
            />
            <Select
              aria-label="Filter by module"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              options={[
                { value: "all", label: "All modules" },
                ...modules.map((module) => ({ value: module, label: module })),
              ]}
            />
            <Select
              aria-label="Filter by activity type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              options={[
                { value: "all", label: "All activity" },
                { value: "login", label: "Sign-ins" },
                { value: "page_view", label: "Pages viewed" },
                { value: "mutation", label: "Record changes" },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading activity from the database..." />
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={search || moduleFilter !== "all" || typeFilter !== "all"
              ? "No matching activity"
              : "No activity recorded yet"}
            description={
              search || moduleFilter !== "all" || typeFilter !== "all"
                ? "Try changing the filters or search terms."
                : "After signing in, visited dashboard pages and successful changes will appear here."
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:grid-cols-[minmax(0,1.3fr)_minmax(140px,0.8fr)_minmax(180px,1fr)] sm:items-center sm:px-5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                      ACTION_STYLES[item.action] ||
                      "bg-slate-50 text-slate-600 ring-slate-600/10"
                    }`}
                  >
                    <ActionIcon activity={item} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          ACTION_STYLES[item.action] ||
                          "bg-slate-50 text-slate-600 ring-slate-600/10"
                        }`}
                      >
                        {item.action}
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        {item.module}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900">
                      {item.details || item.record || item.path}
                    </p>
                    {item.record && item.details !== item.record && (
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                        {item.record}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 sm:pl-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {item.user}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {item.email || item.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 sm:justify-end">
                  <Clock3 className="h-3.5 w-3.5 shrink-0" />
                  <time dateTime={item.timestamp}>
                    {formatTimestamp(item.timestamp)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredActivities.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {filteredActivities.length} of {activities.length} recent
              events
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Updates automatically
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
