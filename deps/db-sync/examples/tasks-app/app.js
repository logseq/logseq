const storageKey = "logseq-tasks-demo";

const signedOut = document.querySelector("#signed-out");
const signedIn = document.querySelector("#signed-in");
const signedOutStatus = document.querySelector("#signed-out-status");
const signedInStatus = document.querySelector("#signed-in-status");
const taskList = document.querySelector("#tasks");
const graphName = document.querySelector("#graph-name");

function readSession() {
  const raw = sessionStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : null;
}

function writeSession(session) {
  sessionStorage.setItem(storageKey, JSON.stringify(session));
}

async function loadConfig() {
  const response = await fetch("/config.json");
  if (!response.ok) throw new Error("Missing preview config");
  return response.json();
}

function base64url(bytes) {
  let text = "";
  bytes.forEach((byte) => {
    text += String.fromCharCode(byte);
  });
  return btoa(text).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function createChallenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const verifier = base64url(bytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return {verifier, challenge: base64url(new Uint8Array(digest))};
}

function showError(target, error) {
  target.textContent = error instanceof Error ? error.message : String(error);
}

async function api(session, path, options) {
  const response = await fetch(session.apiBase + path, {
    ...options,
    headers: {
      authorization: "Bearer " + session.accessToken,
      ...(options && options.body ? {"content-type": "application/json"} : {})
    }
  });
  if (response.status === 401 && session.refreshToken) {
    const refreshed = await refresh(session);
    return api(refreshed, path, options);
  }
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (response.status === 204) return null;
  return response.json();
}

async function refresh(session) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
    client_id: session.clientId
  });
  const response = await fetch(session.apiBase + "/oauth/token", {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body
  });
  if (!response.ok) throw new Error(await response.text());
  const token = await response.json();
  const next = {
    ...session,
    accessToken: token.access_token,
    refreshToken: token.refresh_token
  };
  writeSession(next);
  return next;
}

function renderTasks(tasks) {
  taskList.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement("li");
    empty.textContent = "No tasks yet";
    taskList.append(empty);
    return;
  }
  tasks.forEach((task) => {
    const item = document.createElement("li");
    const title = document.createElement("span");
    title.textContent = task.title || "";
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = (task.status && task.status.title) || "Todo";
    item.append(title, meta);
    taskList.append(item);
  });
}

async function loadTasks(session) {
  signedInStatus.textContent = "";
  const page = await api(session, "/api/v1/graphs/" + session.graphId + "/tasks");
  renderTasks(page.tasks || []);
}

function showApp(session) {
  signedOut.hidden = true;
  signedIn.hidden = false;
  graphName.textContent = session.graphName || session.graphId;
}

async function exchangeCode(config, code, verifier) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    redirect_uri: location.origin + "/callback",
    code_verifier: verifier
  });
  const response = await fetch(config.apiBase + "/oauth/token", {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function start() {
  const config = await loadConfig();
  const params = new URLSearchParams(location.search);
  if (location.pathname === "/callback") {
    const pending = readSession();
    if (!pending?.state || !pending.verifier || params.get("state") !== pending.state) {
      throw new Error("Invalid sign-in callback");
    }
    const error = params.get("error");
    if (error) throw new Error(error);
    const code = params.get("code");
    if (!code) throw new Error("Invalid sign-in callback");
    const token = await exchangeCode(config, code, pending.verifier);
    const session = {
      apiBase: config.apiBase,
      clientId: config.clientId,
      graphName: config.graphName,
      graphId: token.graph_id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      scope: token.scope
    };
    writeSession(session);
    history.replaceState(null, "", "/");
  }

  let session = readSession();
  if (!session || !session.accessToken) {
    document.querySelector("#sign-in").addEventListener("click", async () => {
      try {
        const {verifier, challenge} = await createChallenge();
        const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
        writeSession({verifier, state, apiBase: config.apiBase, clientId: config.clientId});
        const authorize = new URL(config.apiBase + "/oauth/authorize");
        authorize.searchParams.set("response_type", "code");
        authorize.searchParams.set("client_id", config.clientId);
        authorize.searchParams.set("redirect_uri", location.origin + "/callback");
        authorize.searchParams.set("code_challenge", challenge);
        authorize.searchParams.set("code_challenge_method", "S256");
        authorize.searchParams.set("scope", "logseq/read logseq/write");
        authorize.searchParams.set("state", state);
        location.assign(authorize);
      } catch (error) {
        showError(signedOutStatus, error);
      }
    });
    return;
  }

  showApp(session);
  await loadTasks(session);
  document.querySelector("#refresh").addEventListener("click", () => {
    session = readSession();
    loadTasks(session).catch((error) => showError(signedInStatus, error));
  });
  document.querySelector("#create-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = document.querySelector("#title").value.trim();
    if (!title) return;
    try {
      session = readSession();
      await api(session, "/api/v1/graphs/" + session.graphId + "/tasks", {
        method: "POST",
        body: JSON.stringify({title})
      });
      document.querySelector("#title").value = "";
      await loadTasks(readSession());
    } catch (error) {
      showError(signedInStatus, error);
    }
  });
}

start().catch((error) => showError(signedOutStatus, error));
