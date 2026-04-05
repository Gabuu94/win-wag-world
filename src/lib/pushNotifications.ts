// Push notification utilities
export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/placeholder.svg",
      badge: "/placeholder.svg",
    });
  } catch {
    // Silent fail on mobile browsers that don't support Notification constructor
  }
}

export function isPushSupported(): boolean {
  return "Notification" in window;
}
