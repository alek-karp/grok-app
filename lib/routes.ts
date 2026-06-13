export const ROUTES = {
  home: "/",
  agent: "/agent",
  dashboard: "/dashboard",
  personalization: "/personalization",
  phone: "/phone",
  call: (id: string) => `/call/${id}`,
} as const;
