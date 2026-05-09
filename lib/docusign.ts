/**
 * lib/docusign.ts
 * DocuSign API client factory with JWT token caching.
 *
 * Uses require() instead of import so Turbopack (Next.js 15+) doesn't
 * statically bundle the AMD-based docusign-esign package.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const docusign = require("docusign-esign") as typeof import("docusign-esign");

const DS_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY!;
const DS_USER_ID         = process.env.DOCUSIGN_USER_ID!;
const DS_ACCOUNT_ID      = process.env.DOCUSIGN_ACCOUNT_ID!;
const DS_PRIVATE_KEY     = (process.env.DOCUSIGN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
const DS_BASE_PATH       = process.env.DOCUSIGN_BASE_PATH ?? "https://demo.docusign.net/restapi";
const OAUTH_BASE         = DS_BASE_PATH.includes("demo")
  ? "account-d.docusign.com"
  : "account.docusign.com";

let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;
const TOKEN_BUFFER = 60;

export async function getDocuSignToken(): Promise<string> {
  if (_cachedToken && Date.now() / 1000 < _tokenExpiresAt - TOKEN_BUFFER) {
    return _cachedToken;
  }

  const client = new docusign.ApiClient();
  client.setOAuthBasePath(OAUTH_BASE);

  const result = await client.requestJWTUserToken(
    DS_INTEGRATION_KEY,
    DS_USER_ID,
    ["signature", "impersonation"],
    Buffer.from(DS_PRIVATE_KEY),
    3600
  );

  _cachedToken    = result.body.access_token;
  _tokenExpiresAt = Date.now() / 1000 + result.body.expires_in;
  return _cachedToken!;
}

export async function buildDocuSignClient(): Promise<import("docusign-esign").ApiClient> {
  const token = await getDocuSignToken();
  const client = new docusign.ApiClient();
  client.setBasePath(DS_BASE_PATH);
  client.addDefaultHeader("Authorization", `Bearer ${token}`);
  return client;
}

export const DOCUSIGN_ACCOUNT_ID = DS_ACCOUNT_ID;
