const KEYS = {
  phone: "user_phone",
  name: "user_name",
} as const;

export const storage = {
  getPhone: () => localStorage.getItem(KEYS.phone) ?? "",
  getName: () => localStorage.getItem(KEYS.name) ?? "",
  setUser: (phone: string, name: string) => {
    localStorage.setItem(KEYS.phone, phone);
    localStorage.setItem(KEYS.name, name);
  },
  clear: () => {
    localStorage.removeItem(KEYS.phone);
    localStorage.removeItem(KEYS.name);
  },
};
