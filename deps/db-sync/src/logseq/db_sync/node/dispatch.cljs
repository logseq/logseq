(ns logseq.db-sync.node.dispatch
  (:require [clojure.string :as string]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.node.graph :as graph]
            [logseq.db-sync.node.routes :as node-routes]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.handler.assets :as assets-handler]
            [logseq.db-sync.worker.handler.index :as index-handler]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.http :as http]
            [promesa.core :as p]))

(defn- admin-token-valid?
  [request env]
  (let [expected (aget env "DB_SYNC_ADMIN_TOKEN")
        actual (.get (.-headers request) "x-db-sync-admin-token")]
    (and (string? expected)
         (seq expected)
         (= expected actual))))

(def ^:private pair-page-html
  "Device-pairing helper for local mode. Served without auth and contains no
   secret: the access token arrives in the URL fragment (never sent to the
   server) and is turned into a logseq://sync-setup deep link client-side."
  "<!doctype html>
<html>
<head>
<meta charset=\"utf-8\">
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
<title>Pair Logseq</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 28rem;
         margin: 3rem auto; padding: 0 1rem; color: #222; }
  code { background: #f2f2f2; padding: 0.15rem 0.4rem; border-radius: 4px;
         word-break: break-all; }
  .btn { display: block; text-align: center; background: #0055d4; color: #fff;
         padding: 0.9rem 1rem; border-radius: 8px; text-decoration: none;
         font-weight: 600; margin: 1.5rem 0; }
  .muted { color: #777; font-size: 0.9rem; }
</style>
</head>
<body>
<h2>Connect Logseq to this sync server</h2>
<p>Server: <code id=\"srv\"></code></p>
<a id=\"open\" class=\"btn\" href=\"#\">Open in Logseq</a>
<p class=\"muted\">If the button does nothing, configure it manually in
Logseq &rarr; Settings &rarr; Sync Server URL:</p>
<p class=\"muted\">URL: <code id=\"url\"></code><br>
Access token: <code id=\"tok\"></code></p>
<script>
  var token = location.hash.slice(1);
  var base = location.origin;
  document.getElementById('srv').textContent = base;
  document.getElementById('url').textContent = base;
  document.getElementById('tok').textContent =
    token || '(missing - rescan the QR code)';
  document.getElementById('open').href =
    'logseq://sync-setup?url=' + encodeURIComponent(base) +
    '&token=' + encodeURIComponent(token);
</script>
</body>
</html>")

(defn- pair-page-response []
  (js/Response. pair-page-html
                #js {:status 200
                     :headers #js {"content-type" "text/html; charset=utf-8"
                                   "cache-control" "no-store"}}))

(defn handle-node-fetch
  [{:keys [request env registry deps]}]
  (let [url (platform/request-url request)
        path (.-pathname url)
        method (.-method request)
        index-self #js {:env env :d1 (aget env "DB")}]
    (cond
      (= path "/health")
      (http/json-response :worker/health {:ok true})

      ;; only meaningful in local-token mode; harmless otherwise
      (= path "/pair")
      (pair-page-response)

      (or (= path "/graphs")
          (string/starts-with? path "/graphs/"))
      (index-handler/handle-fetch index-self request)

      (string/starts-with? path "/e2ee")
      (index-handler/handle-fetch index-self request)

      (string/starts-with? path "/assets/")
      (if (= method "OPTIONS")
        (assets-handler/handle request env)
        (if-let [{:keys [graph-id]} (assets-handler/parse-asset-path path)]
          (if (admin-token-valid? request env)
            (assets-handler/handle request env)
            (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
              (if (.-ok access-resp)
                (assets-handler/handle request env)
                access-resp)))
          (http/bad-request "invalid asset path")))

      (= method "OPTIONS")
      (common/options-response)

      (string/starts-with? path "/sync/")
      (if-let [{:keys [graph-id tail]} (node-routes/parse-sync-path path)]
        (if (seq graph-id)
          (if (= method "OPTIONS")
            (common/options-response)
            (if (admin-token-valid? request env)
              (let [ctx (graph/get-or-create-graph registry deps graph-id)
                    new-url (js/URL. (str (.-origin url) tail (.-search url)))]
                (.set (.-searchParams new-url) "graph-id" graph-id)
                (let [rewritten (platform/request (.toString new-url) request)]
                  (sync-handler/handle-http ctx rewritten)))
              (p/let [access-resp (index-handler/graph-access-response request env graph-id)]
                (if (.-ok access-resp)
                  (let [ctx (graph/get-or-create-graph registry deps graph-id)
                        new-url (js/URL. (str (.-origin url) tail (.-search url)))]
                    (.set (.-searchParams new-url) "graph-id" graph-id)
                    (let [rewritten (platform/request (.toString new-url) request)]
                      (sync-handler/handle-http ctx rewritten)))
                  access-resp))))
          (http/bad-request "missing graph id"))
        (http/bad-request "missing graph id"))

      :else
      (http/not-found))))
