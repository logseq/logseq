// Local stand-in for the Cognito calls this preview makes.
// The node adapter posts USER_PASSWORD_AUTH to https://cognito-idp.<issuer-host>/
// and loads COGNITO_JWKS_URL. This file answers those two fetches.
// It is not a way to skip Cognito in a real deployment.

const crypto = require("crypto");
const fs = require("fs");

const DEMO_USERNAME = "ada";
const DEMO_PASSWORD = "tasks-demo";
const DEMO_SUB = "user-tasks-demo";
const DEMO_KID = "tasks-demo";

function signJwt(payload, privateKey, kid) {
  const header = Buffer.from(JSON.stringify({alg: "RS256", typ: "JWT", kid})).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = header + "." + body;
  const signature = crypto.createSign("RSA-SHA256").update(data).sign(privateKey).toString("base64url");
  return data + "." + signature;
}

function generateKeys() {
  const pair = crypto.generateKeyPairSync("rsa", {modulusLength: 2048});
  const publicJwk = pair.publicKey.export({format: "jwk"});
  publicJwk.kid = DEMO_KID;
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";
  return {
    privateKeyPem: pair.privateKey.export({type: "pkcs8", format: "pem"}),
    publicJwk
  };
}

function userClaims(nowSeconds) {
  return {
    sub: DEMO_SUB,
    iss: process.env.COGNITO_ISSUER,
    aud: process.env.COGNITO_CLIENT_ID,
    "cognito:username": DEMO_USERNAME,
    email: "ada@demo.local",
    "cognito:groups": ["rtc_2025_07_10"],
    iat: nowSeconds,
    exp: nowSeconds + (60 * 60 * 24 * 30)
  };
}

function installFetchPatch() {
  if (process.env.TASKS_DEMO_PATCH_FETCH !== "1") return;
  const keys = JSON.parse(fs.readFileSync(process.env.TASKS_DEMO_KEYS, "utf8"));
  const privateKey = crypto.createPrivateKey(keys.privateKeyPem);
  const original = global.fetch.bind(global);
  global.fetch = async function(input, init) {
    const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
    if (url.startsWith("https://cognito-idp.demo.local/")) {
      let body = {};
      try {
        body = JSON.parse((init && init.body) || "{}");
      } catch (_error) {
        body = {};
      }
      const username = body.AuthParameters && body.AuthParameters.USERNAME;
      const password = body.AuthParameters && body.AuthParameters.PASSWORD;
      const accepted = body.AuthFlow === "USER_PASSWORD_AUTH" &&
        body.ClientId === process.env.COGNITO_CLIENT_ID &&
        username === DEMO_USERNAME &&
        password === DEMO_PASSWORD;
      if (!accepted) {
        return new Response(JSON.stringify({
          __type: "NotAuthorizedException",
          message: "Incorrect username or password."
        }), {status: 400, headers: {"content-type": "application/json"}});
      }
      const nowSeconds = Math.floor(Date.now() / 1000);
      const idToken = signJwt(userClaims(nowSeconds), privateKey, DEMO_KID);
      return new Response(JSON.stringify({
        AuthenticationResult: {
          IdToken: idToken,
          AccessToken: idToken,
          RefreshToken: "tasks-demo-refresh"
        }
      }), {status: 200, headers: {"content-type": "application/json"}});
    }
    if (url === process.env.COGNITO_JWKS_URL) {
      return new Response(JSON.stringify({keys: [keys.publicJwk]}), {
        status: 200,
        headers: {"content-type": "application/json"}
      });
    }
    return original(input, init);
  };
}

installFetchPatch();

module.exports = {
  DEMO_USERNAME,
  DEMO_PASSWORD,
  DEMO_SUB,
  DEMO_KID,
  generateKeys,
  signJwt,
  userClaims
};
