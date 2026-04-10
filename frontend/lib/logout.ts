import {
  clearAuthTokens,
  getRefreshToken,
  getAccessToken,
} from "./authTokens";
import { buildUrl } from "./utils";

export async function logout() {
  const rt = getRefreshToken();
  const at = getAccessToken();

  if (rt) {
    await fetch(buildUrl("/auth/logout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(at ? { Authorization: `Bearer ${at}` } : {}),
      },
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => {});
  }

  clearAuthTokens();

  if (typeof window !== "undefined") {
    localStorage.removeItem("gomatch_email_pending");
    localStorage.removeItem("gomatch_email_confirmed");
    window.location.href = "/signin";
  }
}