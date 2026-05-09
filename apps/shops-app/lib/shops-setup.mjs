export const SHOPS_BUSINESS_TYPE_OPTIONS = [
  { value: "mobile_store", label: "Mobile Store" },
  { value: "clothing", label: "Clothing" },
  { value: "shoes", label: "Shoes" },
  { value: "supermarket", label: "Supermarket" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

export const SHOPS_COUNTRY_OPTIONS = [
  { value: "EG", label: "Egypt" },
];

export const SHOPS_CURRENCY_OPTIONS = [
  { value: "EGP", label: "EGP" },
];

export function createInitialShopsSetup(savedSetup) {
  return {
    business_type:
      savedSetup?.business_type ?? SHOPS_BUSINESS_TYPE_OPTIONS[0].value,
    country: savedSetup?.country ?? SHOPS_COUNTRY_OPTIONS[0].value,
    currency: savedSetup?.currency ?? SHOPS_CURRENCY_OPTIONS[0].value,
    first_branch_name: savedSetup?.first_branch_name ?? "Main Branch",
  };
}

export function formatShopsBusinessTypeLabel(value) {
  const option = SHOPS_BUSINESS_TYPE_OPTIONS.find((entry) => entry.value === value);

  return option ? option.label : "Unknown business type";
}

export function formatShopsCountryLabel(value) {
  const option = SHOPS_COUNTRY_OPTIONS.find((entry) => entry.value === value);

  return option ? option.label : "Unknown country";
}

export function formatShopsCurrencyLabel(value) {
  const option = SHOPS_CURRENCY_OPTIONS.find((entry) => entry.value === value);

  return option ? option.label : "Unknown currency";
}
