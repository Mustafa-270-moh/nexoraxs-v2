export const SHOPS_MODE_OPTIONS = [
  {
    value: "business_management",
    label: "Business Management",
    description:
      "Use Shops as a back-office business management system first.",
  },
  {
    value: "online_store",
    label: "Online Store",
    description: "Use Shops as a storefront and online ordering shell first.",
  },
  {
    value: "both",
    label: "Both",
    description:
      "Use the same workspace for business management and online store foundations together.",
  },
];

export function isValidShopsMode(value) {
  return SHOPS_MODE_OPTIONS.some((option) => option.value === value);
}

export function formatShopsModeLabel(value) {
  const option = SHOPS_MODE_OPTIONS.find((entry) => entry.value === value);

  return option ? option.label : "Unknown mode";
}
