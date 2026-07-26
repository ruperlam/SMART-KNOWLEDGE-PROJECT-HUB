"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const TABS: { label: string; value: string | null }[] = [
  { label: "Tất cả", value: null },
  { label: "Chưa đọc", value: "UNREAD" },
  { label: "Đang đọc", value: "IN_PROGRESS" },
  { label: "Đã đọc", value: "READ" },
];

export default function FilterTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status");

  function go(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex bg-card-bg/60 border border-accent-mauve/30 rounded-2xl p-1 gap-1">
      {TABS.map((tab) => {
        const active = current === tab.value || (!current && !tab.value);
        return (
          <button
            key={tab.label}
            onClick={() => go(tab.value)}
            className={`text-sm font-medium px-3.5 py-1.5 rounded-xl transition-colors ${
              active
                ? "bg-accent-blush text-bg-dark"
                : "text-accent-blush hover:text-accent-cream"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
