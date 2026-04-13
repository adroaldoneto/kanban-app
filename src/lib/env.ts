const publicEnv = {
  appMode: process.env.NEXT_PUBLIC_APP_MODE ?? "demo",
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  scheduleApiUrl: process.env.NEXT_PUBLIC_SCHEDULE_API_URL ?? "",
};

export function getPublicEnv() {
  return publicEnv;
}

export function isFirebaseConfigured() {
  return [
    publicEnv.firebaseApiKey,
    publicEnv.firebaseAuthDomain,
    publicEnv.firebaseProjectId,
    publicEnv.firebaseAppId,
  ].every(Boolean);
}

export function getAppMode() {
  return publicEnv.appMode === "live" ? "live" : "demo";
}

export function getScheduleApiUrl() {
  return publicEnv.scheduleApiUrl;
}
