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
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface NavItem {
  label: string;
  href: string;
  icon: IconDefinition;
}

// Ordered to mirror the reference product's nav grouping (2026-09-08): core
// front-desk flow first, then directory/distribution/reporting, then admin.
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: faGauge },
  { label: "Calendar", href: "/bookings/calendar", icon: faCalendarWeek },
  { label: "Halls & events", href: "/halls", icon: faChampagneGlasses },
  { label: "Bookings", href: "/bookings", icon: faCalendarDays },
  { label: "Rooms", href: "/rooms", icon: faDoorOpen },
  { label: "Housekeeping", href: "/housekeeping", icon: faBroom },
  { label: "Maintenance", href: "/maintenance", icon: faScrewdriverWrench },
  { label: "Customers", href: "/customers", icon: faUsers },
  { label: "Channels", href: "/channels", icon: faGlobe },
  { label: "Cash register", href: "/cash-register", icon: faCashRegister },
  { label: "Import", href: "/import", icon: faFileImport },
  { label: "Reports", href: "/reports", icon: faChartLine },
  { label: "Users & roles", href: "/users", icon: faUserShield },
  { label: "Settings", href: "/settings", icon: faGear },
];

// Not in the main nav (reached from a booking row), kept here so icon choice
// stays consistent wherever a folio/invoice link shows up.
export const FOLIO_ICON = faFileInvoice;
