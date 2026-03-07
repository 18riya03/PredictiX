const HEART_STORAGE_KEY = "predictix_heart_input_v1";

export const saveHeartInput = (data) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const payload = JSON.stringify(data || {});
    window.localStorage.setItem(HEART_STORAGE_KEY, payload);
  } catch (err) {
    console.error("Failed to save heart input to localStorage", err);
  }
};

export const loadHeartInput = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(HEART_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load heart input from localStorage", err);
    return null;
  }
};

