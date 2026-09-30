export const OAUTH_ERROR_KEYS: Record<string, string> = {
  access_denied: "oauthErrorAccessDenied",
  invalid_state: "oauthErrorSessionExpired",
  session_expired: "oauthErrorSessionExpired",
  provider_error: "oauthErrorProvider",
  provider_unavailable: "oauthErrorUnavailable",
  rate_limited: "oauthErrorRateLimited",
  unsupported_provider: "oauthErrorUnavailable",
  account_disabled: "oauthErrorAccountDisabled",
  already_linked: "oauthErrorAlreadyLinked",
  identity_taken: "oauthErrorIdentityTaken",
};
