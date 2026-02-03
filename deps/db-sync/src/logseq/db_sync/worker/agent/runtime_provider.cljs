(ns logseq.db-sync.worker.agent.runtime-provider
  (:require [clojure.string :as string]
            [logseq.db-sync.worker.agent.sandbox :as sandbox]
            [promesa.core :as p]))

;; -----------------------
;; helpers
;; -----------------------

(defn- env-str [^js env k]
  (let [v (aget env k)]
    (when (string? v)
      (let [t (string/trim v)]
        (when-not (string/blank? t) t)))))

(defn- parse-int [v default]
  (let [n (some-> v js/parseInt)]
    (if (and (number? n) (not (js/isNaN n))) n default)))

(defn- parse-json-safe [s]
  (try
    (js->clj (js/JSON.parse s) :keywordize-keys true)
    (catch :default _ {})))

(defn- strip-trailing-slash [s]
  (string/replace (or s "") #"/+$" ""))

(defn- normalize-provider [value]
  (when (string? value)
    (let [normalized (-> value string/trim string/lower-case)]
      (when-not (string/blank? normalized) normalized))))

(defn provider-kind [^js env]
  (or (normalize-provider (env-str env "AGENT_RUNTIME_PROVIDER"))
      "sprites"))

(defn runtime-provider-kind [^js env runtime]
  (or (normalize-provider (:provider runtime))
      (provider-kind env)))

(defn fill-template [template sandbox-id]
  (string/replace (or template "") "{sandbox_id}" (or sandbox-id "")))

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

(defn- sprites-token [^js env]
  (or (env-str env "SPRITE_TOKEN")
      (env-str env "SPRITES_TOKEN")))

(defn- sprites-base-url [^js env]
  (or (env-str env "SPRITES_API_URL")
      "https://api.sprites.dev"))

(defn- sprites-http-url [base path]
  (str (strip-trailing-slash base) path))

(defn- build-query [pairs]
  (->> pairs
       (map (fn [[k v]]
              (str (js/encodeURIComponent (name k))
                   "="
                   (js/encodeURIComponent (str v)))))
       (string/join "&")))

(defn- token-header! [^js headers token]
  (when (string? token)
    (.set headers "Authorization" (str "Bearer " token))))

(defn- escape-shell-single [value]
  (string/replace (or value "") "'" "'\"'\"'"))

(defn- ->base64
  [value]
  (when (string? value)
    (let [bytes (.encode (js/TextEncoder.) value)
          binary (apply str (map char bytes))]
      (js/btoa binary))))

(defn- curl-auth-arg [token]
  ;; token may be nil in --no-token mode
  (if (string? token)
    (str "-H 'authorization: Bearer " (escape-shell-single token) "'")
    ""))

(defn- curl-json-arg [body]
  (if (some? body)
    (str "--data '" (escape-shell-single (js/JSON.stringify (clj->js body))) "'")
    ""))

(defn- sprite-local-url [port path]
  (str "http://127.0.0.1:" port path))

(def ^:private default-repo-base-dir "/workspace")

(defn- ->promise
  [v]
  (js/Promise.resolve v))

(defn- fetch-json!
  [method url {:keys [token json-body]}]
  (let [^js h (js/Headers.)]
    (.set h "Accept" "application/json")
    (when token (token-header! h token))
    (when json-body (.set h "Content-Type" "application/json"))
    (p/let [resp (js/fetch url
                           (clj->js (cond-> {:method method :headers h}
                                      json-body (assoc :body (js/JSON.stringify (clj->js json-body))))))
            status (.-status resp)
            text (->promise (.text resp))
            data (parse-json-safe text)]
      (if (<= 200 status 299)
        data
        (throw (ex-info "sprites http error" {:status status :url url :body data}))))))

;; -----------------------
;; Sprites REST
;; -----------------------

(defn- sprites-create-or-get! [^js env name]
  (let [base (sprites-base-url env)
        token (sprites-token env)]
    (when-not (string? token)
      (throw (ex-info "missing SPRITE_TOKEN/SPRITES_TOKEN (Sprites API token)" {})))
    (p/catch
     (fetch-json! "POST" (sprites-http-url base "/v1/sprites")
                  {:token token :json-body {:name name}})
     (fn [_]
       (fetch-json! "GET" (sprites-http-url base (str "/v1/sprites/" name))
                    {:token token})))))

(defn- sprites-delete! [^js env name]
  (let [base (sprites-base-url env)
        token (sprites-token env)]
    (p/catch
     (fetch-json! "DELETE" (sprites-http-url base (str "/v1/sprites/" name))
                  {:token token})
     (fn [_] nil))))

(defn- sprites-exec-post!
  [^js env sprite-name cmd-vec]
  (let [base (sprites-base-url env)
        token (sprites-token env)
        q (build-query (map (fn [c] [:cmd c]) cmd-vec))
        url (sprites-http-url base (str "/v1/sprites/" sprite-name "/exec?" q))]
    (prn :debug :post url)
    (fetch-json! "POST" url {:token token})))

;; -----------------------
;; Worker WS upgrade to Sprites exec
;; IMPORTANT: use https URL + Upgrade headers (not wss://)
;; -----------------------

(defn- sprites-exec-upgrade-url [^js env sprite-name cmd-vec]
  (let [base (sprites-base-url env)
        q (build-query (map (fn [c] [:cmd c]) cmd-vec))]
    (sprites-http-url base (str "/v1/sprites/" sprite-name "/exec?" q))))

(defn- ws-upgrade! [^js env upgrade-url]
  (let [token (sprites-token env)]
    (when-not (string? token)
      (throw (ex-info "missing SPRITE_TOKEN/SPRITES_TOKEN (Sprites API token)" {})))
    (let [^js headers (js/Headers.)]
      (token-header! headers token)
      (.set headers "Upgrade" "websocket")
      (.set headers "Connection" "Upgrade")
      (p/let [^js resp (js/fetch upgrade-url #js {:method "GET" :headers headers})
              status (.-status resp)]
        (when-not (= 101 status)
          (p/let [body (->promise (.text resp))]
            (throw (ex-info "sprites ws upgrade failed"
                            {:status status :url upgrade-url :body body}))))
        (let [ws (.-webSocket resp)]
          (.accept ws)
          (set! (.-binaryType ws) "arraybuffer")
          ws)))))

;; -----------------------
;; REALTIME: Sprites WS stdout/stderr -> TransformStream -> SSE Response
;; -----------------------

(defn- sprites-ws->sse-response!
  "Runs cmd inside sprite and streams stdout/stderr bytes to the HTTP client as SSE.
   Uses TransformStream (reliable in Workers) instead of manual ReadableStream controllers."
  [^js env sprite-name cmd-vec]
  (p/let [ws (ws-upgrade! env (sprites-exec-upgrade-url env sprite-name cmd-vec))]
    (let [ts (js/TransformStream.)
          writer (.getWriter (.-writable ts))]

      (set! (.-onmessage ws)
            (fn [evt]
              (let [data (.-data evt)]
                (cond
                  ;; ignore JSON control messages
                  (string? data) nil

                  (instance? js/ArrayBuffer data)
                  (let [u8 (js/Uint8Array. data)
                        n (.-length u8)]
                    (when (> n 0)
                      (let [sid (.at u8 0)
                            payload (.subarray u8 1)]
                        (cond
                          ;; stdout/stderr
                          (or (= sid 1) (= sid 2))
                          ;; write ONLY bytes
                          (.write writer payload)

                          ;; exit
                          (= sid 3)
                          (do
                            (try (.close writer) (catch :default _ nil))
                            (try (.close ws 1000) (catch :default _ nil)))

                          :else nil))))

                  :else
                  (do
                    (try (.abort writer (js/Error. "unexpected ws frame type")) (catch :default _ nil))
                    (try (.close ws 1011 "bad frame") (catch :default _ nil)))))))

      (set! (.-onerror ws)
            (fn [e]
              (try (.abort writer e) (catch :default _ nil))))

      (set! (.-onclose ws)
            (fn [_]
              (try (.close writer) (catch :default _ nil))))

      (js/Response.
       (.-readable ts)
       #js {:status 200
            :headers #js {"content-type" "text/event-stream"
                          "cache-control" "no-cache"
                          "connection" "keep-alive"}}))))

;; -----------------------
;; sandbox-agent bootstrap + health + create-session
;; -----------------------

(defn auth-json-write-command
  [auth-json]
  (when-let [encoded (->base64 auth-json)]
    (str "mkdir -p ~/.codex; "
         "printf \"%s\" \"" encoded "\" | base64 -d > ~/.codex/auth.json; ")))

(defn- <sprite-bootstrap! [^js env sprite-name port task]
  (let [auth-json (get-in task [:agent :auth-json])
        write-auth (or (auth-json-write-command auth-json) "")
        bootstrap (or (env-str env "SPRITES_BOOTSTRAP_COMMAND")
                      (str "command -v sandbox-agent >/dev/null 2>&1 || "
                           "(curl -fsSL https://releases.rivet.dev/sandbox-agent/latest/install.sh | sh); "
                           write-auth
                           "nohup sandbox-agent server --no-token --host 0.0.0.0 --port " port
                           " >/tmp/sandbox-agent.log 2>&1 &"))]
    (sprites-exec-post! env sprite-name ["bash" "-lc" bootstrap])))

(defn- <sprite-health! [^js env sprite-name port agent-token retries interval-ms]
  (if (<= retries 0)
    (throw (ex-info "sandbox-agent health check timed out in sprite"
                    {:sprite sprite-name :port port}))
    (let [script (str "curl -fsS "
                      (curl-auth-arg agent-token)
                      " "
                      (sprite-local-url port "/v1/health")
                      " >/dev/null")]
      (-> (sprites-exec-post! env sprite-name ["bash" "-lc" script])
          (p/then (fn [_] true))
          (p/catch (fn [_]
                     (p/let [_ (p/delay interval-ms)]
                       (<sprite-health! env sprite-name port agent-token (dec retries) interval-ms))))))))

(defn- task-repo-url [task]
  (some-> (get-in task [:project :repo-url]) str string/trim not-empty))

(defn- repo-dir [session-id]
  (let [session-id (some-> session-id str)]
    (when (string? session-id)
      (str default-repo-base-dir "/" (sanitize-name session-id)))))

(defn- fill-repo-template
  [template {:keys [repo-url session-id repo-dir]}]
  (-> (or template "")
      (string/replace "{repo_url}" (or repo-url ""))
      (string/replace "{session_id}" (or session-id ""))
      (string/replace "{repo_dir}" (or repo-dir ""))))

(defn repo-clone-command
  [^js env session-id task]
  (let [repo-url (task-repo-url task)
        session-id (some-> session-id str)
        repo-dir (repo-dir session-id)
        override (env-str env "SPRITES_REPO_CLONE_COMMAND")]
    (when (and (string? repo-url) (string? session-id) (string? repo-dir))
      (if (string? override)
        (fill-repo-template override {:repo-url repo-url
                                      :session-id session-id
                                      :repo-dir repo-dir})
        (str "mkdir -p " default-repo-base-dir
             " && cd " default-repo-base-dir
             " && git clone '" (escape-shell-single repo-url) "' '" (escape-shell-single repo-dir) "'"
             " && chmod -R u+rw '" (escape-shell-single repo-dir) "'")))))

(defn session-payload [task]
  (let [agent (or (get-in task [:agent :provider])
                  (get-in task [:agent :id])
                  (:agent task))
        agent (or (sandbox/normalize-agent-id agent) agent)]
    {:agent agent
     :agentMode (or (get-in task [:agent :mode])
                    (get-in task [:agent :agent-mode])
                    (get-in task [:agent :model])
                    "build")
     :permissionMode (or (get-in task [:agent :permission-mode])
                         (get-in task [:agent :permissionMode])
                         "read-write")}))

(defn- <sprite-create-session! [^js env sprite-name port agent-token session-id payload]
  (let [script (str "curl -fsS -X POST -H 'content-type: application/json' "
                    (curl-auth-arg agent-token)
                    " "
                    (curl-json-arg payload)
                    " "
                    (sprite-local-url port (str "/v1/sessions/" session-id)))]
    (prn :debug :script script)
    (p/let [result (sprites-exec-post! env sprite-name ["bash" "-lc" script])
            stdout (or (:stdout result) "")
            parsed (parse-json-safe stdout)]
      (assoc parsed :session-id session-id))))

(defn- <sprite-clone-repo! [^js env sprite-name session-id task]
  (prn :debug :cmd (repo-clone-command env session-id task))
  (when-let [cmd (repo-clone-command env session-id task)]
    (sprites-exec-post! env sprite-name ["bash" "-lc" cmd])))

;; ============================================================
;; RuntimeProvider + SpritesProvider
;; ============================================================

(defprotocol RuntimeProvider
  (<provision-runtime! [this session-id task])
  (<open-message-stream! [this runtime message])
  (<terminate-runtime! [this runtime]))

(defrecord SpritesProvider [env]
  RuntimeProvider

  (<provision-runtime! [_ session-id task]
    (let [name (sprite-name env session-id)
          port (parse-int (env-str env "SPRITES_SANDBOX_AGENT_PORT") 2468)
          agent-token (env-str env "SANDBOX_AGENT_TOKEN") ;; may be nil if --no-token
          health-retries (parse-int (env-str env "SPRITES_HEALTH_RETRIES") 120)
          health-interval-ms (parse-int (env-str env "SPRITES_HEALTH_INTERVAL_MS") 500)]
      (p/let [_ (sprites-create-or-get! env name)
              _ (<sprite-bootstrap! env name port task)
              _ (<sprite-health! env name port agent-token health-retries health-interval-ms)
              _ (<sprite-clone-repo! env name session-id task)
              payload (session-payload task)
              response (<sprite-create-session! env name port agent-token session-id payload)]
        {:provider "sprites"
         :sprite-name name
         :sandbox-port port
         :agent-token agent-token
         :session-id (:session-id response)})))

  ;; REALTIME streaming endpoint:
  ;; We stream stdout bytes of `curl -N ... text/event-stream` run inside sprite.
  (<open-message-stream! [_ runtime message]
    (let [name (:sprite-name runtime)
          port (or (:sandbox-port runtime)
                   (parse-int (env-str env "SPRITES_SANDBOX_AGENT_PORT") 2468))
          agent-token (or (:agent-token runtime)
                          (env-str env "SANDBOX_AGENT_TOKEN"))]
      (when-not (string? name)
        (throw (ex-info "missing sprite-name on runtime" {:runtime runtime})))

      (let [script (str "curl -sS -N -X POST "
                        "-H 'accept: text/event-stream' "
                        "-H 'content-type: application/json' "
                        (curl-auth-arg agent-token)
                        " "
                        (curl-json-arg {:message (:message message)})
                        " "
                        (sprite-local-url port (str "/v1/sessions/" (:session-id runtime) "/messages/stream")))]
        (prn :debug :message message)
        (sprites-ws->sse-response! env name ["bash" "-lc" script]))))

  (<terminate-runtime! [_ runtime]
    (if-not (string? (:sprite-name runtime))
      (p/resolved nil)
      (sprites-delete! env (:sprite-name runtime)))))

(defn create-provider [^js env _kind]
  (->SpritesProvider env))

(defn resolve-provider
  [^js env _runtime]
  (create-provider env "sprites"))
