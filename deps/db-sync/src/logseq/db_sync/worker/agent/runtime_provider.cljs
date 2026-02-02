(ns logseq.db-sync.worker.agent.runtime-provider
  (:require [clojure.string :as string]
            [logseq.db-sync.platform.core :as platform]
            [logseq.db-sync.worker.agent.sandbox :as sandbox]
            [promesa.core :as p]))

(defprotocol RuntimeProvider
  (<provision-runtime! [this session-id task])
  (<open-message-stream! [this runtime message])
  (<terminate-runtime! [this runtime]))

(defn- env-str [^js env key]
  (let [value (aget env key)]
    (when (string? value)
      (let [value (string/trim value)]
        (when-not (string/blank? value)
          value)))))

(defn fill-template [template sandbox-id]
  (string/replace (or template "") "{sandbox_id}" sandbox-id))

(defn- normalize-provider-kind [kind]
  (let [kind (some-> kind str string/lower-case string/trim)]
    (case kind
      ("local" "local-dev" "local_dev") "local-dev"
      ("cloudflare" "cloudflare-sandbox" "cloudflare_sandbox") "cloudflare-sandbox"
      (or kind "local-dev"))))

(defn provider-kind [^js env]
  (normalize-provider-kind (env-str env "AGENT_RUNTIME_PROVIDER")))

(defn runtime-provider-kind [^js env runtime]
  (normalize-provider-kind
   (or (:provider runtime)
       (provider-kind env))))

(defn- parse-int [value default]
  (if-let [n (some-> value js/parseInt)]
    (if (js/isNaN n) default n)
    default))

(defn- token-header! [^js headers token]
  (when (string? token)
    (.set headers "authorization" (str "Bearer " token))))

(defn- session-payload [task]
  {:agent (or (get-in task [:agent :provider])
              (get-in task [:agent :id])
              (:agent task))
   :agent-mode (or (get-in task [:agent :mode])
                   (get-in task [:agent :agent-mode])
                   (get-in task [:agent :model]))
   :permission-mode (or (get-in task [:agent :permission-mode])
                        (get-in task [:agent :permissionMode]))})

(defrecord LocalDevProvider [env]
  RuntimeProvider
  (<provision-runtime! [_ session-id task]
    (let [base (env-str env "SANDBOX_AGENT_URL")
          token (env-str env "SANDBOX_AGENT_TOKEN")]
      (if-not (string? base)
        (p/resolved nil)
        (let [endpoint (sandbox/normalize-base-url base)
              payload (session-payload task)]
          (p/let [response (sandbox/<create-session endpoint token session-id payload)]
            {:provider "local-dev"
             :agent-endpoint endpoint
             :session-id (:session-id response)})))))

  (<open-message-stream! [_ runtime message]
    (sandbox/<open-message-stream (:agent-endpoint runtime)
                                  (or (:agent-token runtime)
                                      (env-str env "SANDBOX_AGENT_TOKEN"))
                                  (:session-id runtime)
                                  message))

  (<terminate-runtime! [_ _runtime]
    (p/resolved nil)))

(defn- bootstrap-command [^js env]
  (or (env-str env "CLOUDFLARE_SANDBOX_BOOTSTRAP_COMMAND")
      "curl -fsSL https://releases.rivet.dev/sandbox-agent/latest/install.sh | sh && sandbox-agent server --no-token --host 0.0.0.0 --port 2468"))

(defn- <wait-health! [endpoint token retries interval-ms]
  (if (<= retries 0)
    (throw (ex-info "sandbox-agent health check timed out"
                    {:endpoint endpoint}))
    (let [headers (js/Headers.)
          _ (token-header! headers token)
          req (platform/request (str endpoint "/v1/health")
                                #js {:method "GET" :headers headers})]
      (p/let [resp (js/fetch req)
              status (.-status resp)]
        (if (<= 200 status 299)
          true
          (p/let [_ (p/delay interval-ms)]
            (<wait-health! endpoint token (dec retries) interval-ms)))))))

(defn- sandbox-binding [^js env]
  (aget env "Sandbox"))

(defonce ^:private sandbox-sdk* (atom nil))

(defn- <sandbox-sdk []
  (if-let [sdk @sandbox-sdk*]
    (p/resolved sdk)
    (-> (js/import "@cloudflare/sandbox")
        (.then (fn [module]
                 (reset! sandbox-sdk* module)
                 module)))))

(defn- sandbox-options [^js env]
  (let [sleep-after (or (env-str env "CLOUDFLARE_SANDBOX_SLEEP_AFTER")
                        "10m")
        memory (some-> (env-str env "CLOUDFLARE_SANDBOX_MEMORY_MB")
                       (parse-int 0))
        opts #js {:sleepAfter sleep-after}]
    (when (pos? memory)
      (aset opts "memory" memory))
    opts))

(defn- <get-cf-sandbox [^js env sandbox-id]
  (let [binding (sandbox-binding env)]
    (when-not binding
      (throw (ex-info "missing Sandbox binding in worker env" {})))
    (p/let [^js sdk (<sandbox-sdk)
            get-sandbox (.-getSandbox sdk)]
      (when-not (fn? get-sandbox)
        (throw (ex-info "cloudflare sandbox sdk is unavailable" {})))
      (get-sandbox binding sandbox-id (sandbox-options env)))))

(defn- cf-sandbox-id [session-id]
  (str "agent-" session-id))

(defrecord CloudflareSandboxProvider [env]
  RuntimeProvider
  (<provision-runtime! [_ session-id task]
    (let [sandbox-id (cf-sandbox-id session-id)
          sandbox-port (parse-int (env-str env "CLOUDFLARE_SANDBOX_AGENT_PORT") 2468)
          hostname (env-str env "CLOUDFLARE_SANDBOX_HOSTNAME")
          token (env-str env "SANDBOX_AGENT_TOKEN")
          health-retries (parse-int (env-str env "CLOUDFLARE_SANDBOX_HEALTH_RETRIES") 120)
          health-interval-ms (parse-int (env-str env "CLOUDFLARE_SANDBOX_HEALTH_INTERVAL_MS") 500)]
      (when-not (string? hostname)
        (throw (ex-info "missing CLOUDFLARE_SANDBOX_HOSTNAME" {})))
      (p/let [^js sandbox (<get-cf-sandbox env sandbox-id)
              ^js process (.startProcess sandbox (bootstrap-command env) #js {:autoCleanup true})
              _ (.waitForPort process sandbox-port #js {:mode "http"
                                                        :path "/v1/health"
                                                        :status 200})
              endpoint-resp (.exposePort sandbox sandbox-port
                                         (clj->js
                                          (cond-> {:hostname hostname}
                                            (env-str env "CLOUDFLARE_SANDBOX_PORT_TOKEN")
                                            (assoc :token (env-str env "CLOUDFLARE_SANDBOX_PORT_TOKEN")))))
              endpoint (some-> (aget endpoint-resp "url")
                               sandbox/normalize-base-url)
              _ (when-not (string? endpoint)
                  (throw (ex-info "cloudflare sandbox exposePort returned no url"
                                  {:sandbox-id sandbox-id
                                   :port sandbox-port})))
              _ (<wait-health! endpoint token health-retries health-interval-ms)
              payload (session-payload task)
              response (sandbox/<create-session endpoint token session-id payload)]
        {:provider "cloudflare-sandbox"
         :sandbox-id sandbox-id
         :sandbox-port sandbox-port
         :agent-endpoint endpoint
         :agent-token token
         :session-id (:session-id response)})))

  (<open-message-stream! [_ runtime message]
    (sandbox/<open-message-stream (:agent-endpoint runtime)
                                  (or (:agent-token runtime)
                                      (env-str env "SANDBOX_AGENT_TOKEN"))
                                  (:session-id runtime)
                                  message))

  (<terminate-runtime! [_ runtime]
    (if-not (string? (:sandbox-id runtime))
      (p/resolved nil)
      (p/let [^js sandbox (<get-cf-sandbox env (:sandbox-id runtime))]
        (-> (.destroy sandbox)
            (.catch (fn [_] nil)))))))

(defn create-provider [^js env kind]
  (case kind
    "cloudflare-sandbox" (->CloudflareSandboxProvider env)
    (->LocalDevProvider env)))

(defn resolve-provider
  [^js env runtime]
  (create-provider env (runtime-provider-kind env runtime)))
