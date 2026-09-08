import {
  faGauge,
  faCalendarDays,
  faCalendarWeek,
  faDoorOpen,
  faFileInvoice,
  faFileImport,
  faChampagneGlasses,
  faUsers,
  faGlobe,
  faChartLine,
  faUserShield,
  faGear,
  faBroom,
  faScrewdriverWrench,
  faCashRegister,
  faBullhorn,
  faBuilding,
  faTruck,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface NavItem {
  label: string;
  href: string;
  icon: IconDefinition;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Grouped (2026-09-08) once the flat list passed ~18 items — a long
// unsectioned sidebar is a real usability problem, not just a cosmetic one.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Front desk",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: faGauge },
      { label: "Calendar", href: "/bookings/calendar", icon: faCalendarWeek },
      { label: "Bookings", href: "/bookings", icon: faCalendarDays },
      { label: "Rooms", href: "/rooms", icon: faDoorOpen },
      { label: "Housekeeping", href: "/housekeeping", icon: faBroom },
      { label: "Maintenance", href: "/maintenance", icon: faScrewdriverWrench },
    ],
  },
  {
    label: "Guests",
    items: [
      { label: "Customers", href: "/customers", icon: faUsers },
      { label: "Marketing & CRM", href: "/marketing", icon: faBullhorn },
      { label: "Corporate & agents", href: "/corporate", icon: faBuilding },
      { label: "Reviews", href: "/reviews", icon: faStar },
    ],
  },
  {
    label: "Distribution",
    items: [
      { label: "Halls & events", href: "/halls", icon: faChampagneGlasses },
      { label: "Channels", href: "/channels", icon: faGlobe },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Cash register", href: "/cash-register", icon: faCashRegister },
      { label: "Reports", href: "/reports", icon: faChartLine },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Import", href: "/import", icon: faFileImport },
      { label: "Vendors", href: "/vendors", icon: faTruck },
      { label: "Users & roles", href: "/users", icon: faUserShield },
      { label: "Settings", href: "/settings", icon: faGear },
    ],
  },
];

// Flattened view — used wherever the grouping itself doesn't matter (e.g.
// AppShell's active-link matching).
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

// Not in the main nav (reached from a booking row), kept here so icon choice
// stays consistent wherever a folio/invoice link shows up.
export const FOLIO_ICON = faFileInvoice;
