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
      "sprites" "sprites"
      "local-dev" "local-dev"
      "cloudflare" "cloudflare"
      (or kind "sprites"))))

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

(defonce ^:private sprites-sdk* (atom nil))

(defn- <sprites-sdk []
  (if-let [sdk @sprites-sdk*]
    (p/resolved sdk)
    (-> (js/import "@fly/sprites")
        (.then (fn [module]
                 (reset! sprites-sdk* module)
                 module)))))

(defn- sprites-token [^js env]
  (or (env-str env "SPRITE_TOKEN")
      (env-str env "SPRITES_TOKEN")))

(defn- sprites-client-options [^js env]
  (clj->js
   (cond-> {}
     (env-str env "SPRITES_API_URL")
     (assoc :baseURL (env-str env "SPRITES_API_URL"))
     (env-str env "SPRITES_TIMEOUT_MS")
     (assoc :timeout (parse-int (env-str env "SPRITES_TIMEOUT_MS") 30000)))))

(defn- <sprites-client [^js env]
  (let [token (sprites-token env)]
    (when-not (string? token)
      (throw (ex-info "missing SPRITE_TOKEN" {})))
    (p/let [^js sdk (<sprites-sdk)
            SpritesClient (.-SpritesClient sdk)]
      (when-not (fn? SpritesClient)
        (throw (ex-info "sprites sdk is unavailable" {})))
      (new SpritesClient token (sprites-client-options env)))))

(defn- sanitize-name [name]
  (let [name (or name "task")
        sanitized (-> name
                      string/lower-case
                      (string/replace #"[^a-z0-9-]" "-")
                      (string/replace #"-+" "-")
                      (string/replace #"^-+" "")
                      (string/replace #"-+$" ""))]
    (if (string/blank? sanitized)
      "task"
      (subs sanitized 0 (min 63 (count sanitized))))))

(defn- sprite-name [^js env session-id]
  (let [prefix (or (env-str env "SPRITES_NAME_PREFIX") "logseq-task-")]
    (sanitize-name (str prefix session-id))))

(defn- sprites-config [^js env]
  (let [ram-mb (parse-int (env-str env "SPRITES_RAM_MB") 0)
        cpus (parse-int (env-str env "SPRITES_CPUS") 0)
        storage-gb (parse-int (env-str env "SPRITES_STORAGE_GB") 0)]
    (cond-> {}
      (pos? ram-mb) (assoc :ramMB ram-mb)
      (pos? cpus) (assoc :cpus cpus)
      (string? (env-str env "SPRITES_REGION")) (assoc :region (env-str env "SPRITES_REGION"))
      (pos? storage-gb) (assoc :storageGB storage-gb))))

(defn- escape-shell-single [value]
  (string/replace (or value "") "'" "'\"'\"'"))

(defn- sprite-url [port path]
  (str "http://127.0.0.1:" port path))

(defn- curl-auth-arg [token]
  (if (string? token)
    (str "-H 'authorization: Bearer " (escape-shell-single token) "'")
    ""))

(defn- curl-json-arg [body]
  (if (some? body)
    (str "--data '" (escape-shell-single (js/JSON.stringify (clj->js body))) "'")
    ""))

(defn- parse-json-safe [s]
  (try
    (js->clj (js/JSON.parse s) :keywordize-keys true)
    (catch :default _
      {})))

(defn- <sprite-exec-file [^js sprite command args]
  (p/let [result (.execFile sprite command (clj->js args))]
    (js->clj result :keywordize-keys true)))

(defn- <sprite-health! [sprite port token retries interval-ms]
  (if (<= retries 0)
    (throw (ex-info "sandbox-agent health check timed out in sprite"
                    {:port port}))
    (let [script (str "curl -fsS "
                      (curl-auth-arg token)
                      " "
                      (sprite-url port "/v1/health")
                      " >/dev/null")]
      (-> (<sprite-exec-file sprite "bash" ["-lc" script])
          (.then (fn [_] true))
          (.catch (fn [_]
                    (p/let [_ (p/delay interval-ms)]
                      (<sprite-health! sprite port token (dec retries) interval-ms))))))))

(defn- <sprite-create-session! [sprite port token session-id payload]
  (let [script (str "curl -fsS -X POST -H 'content-type: application/json' "
                    (curl-auth-arg token)
                    " "
                    (curl-json-arg payload)
                    " "
                    (sprite-url port (str "/v1/sessions/" session-id)))]
    (p/let [result (<sprite-exec-file sprite "bash" ["-lc" script])]
      (assoc (parse-json-safe (or (:stdout result) "{}"))
             :session-id session-id))))

(defn- async-iterable->readable-stream [iterable cancel-fn]
  (let [iter-fn (when iterable (aget iterable js/Symbol.asyncIterator))
        iterator (when (fn? iter-fn)
                   (.call iter-fn iterable))
        encoder (js/TextEncoder.)]
    (when-not iterator
      (throw (ex-info "missing async iterator for sprite stream" {})))
    (js/ReadableStream.
     #js {:pull (fn [controller]
                  (-> (.next iterator)
                      (.then (fn [step]
                               (if (.-done step)
                                 (.close controller)
                                 (let [chunk (.-value step)
                                       bytes (cond
                                               (instance? js/Uint8Array chunk) chunk
                                               (string? chunk) (.encode encoder chunk)
                                               :else (.encode encoder (str chunk)))]
                                   (.enqueue controller bytes)))))
                      (.catch (fn [error]
                                (.error controller error)))))
          :cancel (fn [_reason]
                    (when (fn? cancel-fn)
                      (cancel-fn)))})))

(defrecord SpritesProvider [env]
  RuntimeProvider
  (<provision-runtime! [_ session-id task]
    (let [name (sprite-name env session-id)
          port (parse-int (env-str env "SPRITES_SANDBOX_AGENT_PORT") 2468)
          token (or (env-str env "SANDBOX_AGENT_TOKEN")
                    (sprites-token env))
          health-retries (parse-int (env-str env "SPRITES_HEALTH_RETRIES") 120)
          health-interval-ms (parse-int (env-str env "SPRITES_HEALTH_INTERVAL_MS") 500)
          bootstrap (or (env-str env "SPRITES_BOOTSTRAP_COMMAND")
                        "command -v sandbox-agent >/dev/null 2>&1 || (curl -fsSL https://releases.rivet.dev/sandbox-agent/latest/install.sh | sh); nohup sandbox-agent server --no-token --host 127.0.0.1 --port 2468 >/tmp/sandbox-agent.log 2>&1 &")]
      (p/let [^js client (<sprites-client env)
              ^js sprite (-> (.createSprite client name (clj->js (sprites-config env)))
                             (.catch (fn [_]
                                       (.getSprite client name))))
              _ (<sprite-exec-file sprite "bash" ["-lc" bootstrap])
              _ (<sprite-health! sprite port token health-retries health-interval-ms)
              payload (session-payload task)
              response (<sprite-create-session! sprite port token session-id payload)]
        {:provider "sprites"
         :sprite-name name
         :sandbox-port port
         :session-id (:session-id response)})))

  (<open-message-stream! [_ runtime message]
    (let [name (:sprite-name runtime)
          port (or (:sandbox-port runtime)
                   (parse-int (env-str env "SPRITES_SANDBOX_AGENT_PORT") 2468))
          token (or (env-str env "SANDBOX_AGENT_TOKEN")
                    (sprites-token env))]
      (when-not (string? name)
        (throw (ex-info "missing sprite-name on runtime" {:runtime runtime})))
      (p/let [^js client (<sprites-client env)
              ^js sprite (.sprite client name)
              script (str "curl -sS -N -X POST -H 'accept: text/event-stream' -H 'content-type: application/json' "
                          (curl-auth-arg token)
                          " "
                          (curl-json-arg {:message (:message message)})
                          " "
                          (sprite-url port (str "/v1/sessions/" (:session-id runtime) "/messages/stream")))
              ^js cmd (.spawn sprite "bash" #js ["-lc" script])
              stream (async-iterable->readable-stream (.-stdout cmd) #(.kill cmd))]
        (js/Response. stream
                      #js {:status 200
                           :headers #js {"content-type" "text/event-stream"}}))))

  (<terminate-runtime! [_ runtime]
    (if-not (string? (:sprite-name runtime))
      (p/resolved nil)
      (p/let [^js client (<sprites-client env)]
        (-> (.deleteSprite client (:sprite-name runtime))
            (.catch (fn [_] nil)))))))

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
        {:provider "cloudflare"
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
    "sprites" (->SpritesProvider env)
    "cloudflare" (->CloudflareSandboxProvider env)
    (->LocalDevProvider env)))

(defn resolve-provider
  [^js env runtime]
  (create-provider env (runtime-provider-kind env runtime)))
