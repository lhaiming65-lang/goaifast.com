export const appBaseUrl = () => new URL(import.meta.env.BASE_URL || "/", window.location.origin).toString();

export const appUrl = (path = "/") => new URL(path.replace(/^\//, ""), appBaseUrl()).toString();
