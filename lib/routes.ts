export const ROUTES = {
  home: "/",
  agent: "/agent",
  dashboard: "/dashboard",
  phone: "/phone",
  call: (id: string) => `/call/${id}`,
} as const;
