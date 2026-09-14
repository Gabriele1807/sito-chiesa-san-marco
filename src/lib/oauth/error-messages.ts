export const OAUTH_ERROR_KEYS: Record<string, string> = {
  access_denied: "oauthErrorAccessDenied",
  invalid_state: "oauthErrorSessionExpired",
  session_expired: "oauthErrorSessionExpired",
  provider_error: "oauthErrorGeneric",
  provider_unavailable: "oauthErrorGeneric",
  unsupported_provider: "oauthErrorGeneric",
  account_disabled: "oauthErrorGeneric",
  already_linked: "oauthErrorAlreadyLinked",
  identity_taken: "oauthErrorIdentityTaken",
};
