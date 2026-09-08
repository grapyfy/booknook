import Link from "next/link";

export function BookingsViewToggle({ active }: { active: "list" | "calendar" | "groups" }) {
  const tabs = [
    { key: "list", label: "List", href: "/bookings" },
    { key: "calendar", label: "Calendar", href: "/bookings/calendar" },
    { key: "groups", label: "Groups", href: "/bookings/groups" },
  ] as const;

  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.key ? "bg-blue-600 text-white" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
