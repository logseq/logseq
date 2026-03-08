(ns logseq.agents.do
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [logseq.agents.checkpoint-store :as checkpoint-store]
            [logseq.agents.runner-store :as runner-store]
            [logseq.agents.runtime-provider :as runtime-provider]
            [logseq.agents.session :as session]
            [logseq.agents.source-control :as source-control]
            [logseq.sync.common :as common]
            [logseq.sync.platform.core :as platform]
            [logseq.sync.worker.http :as http]
            [promesa.core :as p]))

(defn- header [request name]
  (.get (.-headers request) name))

(defn- user-id-from-request [request]
  (header request "x-user-id"))

(defn- sse-encode [event]
  (str "data: " (js/JSON.stringify (clj->js event)) "\n\n"))

(defn- sse-bytes [event]
  (.encode (js/TextEncoder.) (sse-encode event)))

(defn- <storage-get [storage key]
  (p/let [value (.get storage key)]
    (when value (js->clj value :keywordize-keys true))))

(defn- <storage-put! [storage key value]
  (.put storage key (clj->js value)))

(def ^:private events-meta-key "events.meta")

(defn- events-item-key [idx]
  (str "events." idx))

(defn- valid-events-meta? [meta]
  (and (map? meta)
       (integer? (:count meta))
       (<= 0 (:count meta))))

(defn- <get-events-meta [^js self]
  (p/let [meta (<storage-get (.-storage self) events-meta-key)]
    (when (valid-events-meta? meta)
      meta)))

(defn- <put-events-meta! [^js self count]
  (<storage-put! (.-storage self) events-meta-key {:count count}))

(defn- <persist-events! [^js self events]
  (let [events (vec events)
        storage (.-storage self)]
    (p/let [_ (p/all (map-indexed (fn [idx event]
                                    (<storage-put! storage (events-item-key idx) event))
                                  events))
            _ (<put-events-meta! self (count events))]
      nil)))

(defn- <append-event-storage! [^js self event]
  (p/let [meta (<get-events-meta self)
          meta (or meta {:count 0})
          idx (:count meta)
          _ (<storage-put! (.-storage self) (events-item-key idx) event)
          _ (<put-events-meta! self (inc idx))]
    nil))

(defn- <get-session [^js self]
  (<storage-get (.-storage self) "session"))

(defn- <get-events [^js self]
  (p/let [meta (<get-events-meta self)]
    (if meta
      (let [count (:count meta)]
        (if (zero? count)
          []
          (p/let [events (p/all (map (fn [idx]
                                       (<storage-get (.-storage self) (events-item-key idx)))
                                     (range count)))]
            (->> events
                 (remove nil?)
                 vec))))
      [])))

(defn- <put-session! [^js self session]
  (<storage-put! (.-storage self) "session" session))

(defn- <put-events! [^js self events]
  (<persist-events! self events))

(defn- <save-session! [^js self session]
  (p/let [_ (<put-session! self session)]
    session))

(declare <append-event!)

(defn- session-task
  [session]
  (if (map? (:task session))
    (:task session)
    {}))

(defn- runtime-snapshot-id
  [result]
  (some-> (:snapshot-id result) str string/trim not-empty))

(defn- runtime-checkpoint-payload
  [runtime result reason]
  (let [snapshot-id (runtime-snapshot-id result)
        provider (some-> (:provider runtime) str string/lower-case)]
    (when (string? snapshot-id)
      (cond-> {:provider provider
               :snapshot-id snapshot-id
               :checkpoint-at (common/now-ms)}
        (string? reason) (assoc :reason reason)))))

(defn- checkpoint-payload-with-reason
  [checkpoint reason]
  (let [snapshot-id (runtime-snapshot-id checkpoint)]
    (when (string? snapshot-id)
      (cond-> (assoc checkpoint
                     :snapshot-id snapshot-id
                     :checkpoint-at (common/now-ms))
        (string? reason) (assoc :reason reason)))))

(defn- checkpoint-event-data
  [checkpoint data]
  (let [snapshot-id (runtime-snapshot-id checkpoint)
        provider (some-> (:provider checkpoint) str string/trim not-empty)]
    (cond-> data
      (string? snapshot-id) (assoc :snapshot-id snapshot-id)
      (string? provider) (assoc :provider provider))))

(defn- <persist-session-checkpoint!
  [^js self expected-session-id checkpoint]
  (if-not (and (string? expected-session-id) (map? checkpoint))
    (p/resolved nil)
    (p/let [latest-session (<get-session self)]
      (if (and (map? latest-session)
               (= expected-session-id (:id latest-session)))
        (let [task (session-task latest-session)
              task (assoc task :sandbox-checkpoint checkpoint)]
          (p/let [_ (<save-session! self (assoc latest-session :task task))
                  _ (-> (checkpoint-store/<upsert-checkpoint-for-task! (.-env self)
                                                                       task
                                                                       checkpoint)
                        (p/catch (fn [error]
                                   (log/error :agent/checkpoint-d1-upsert-failed
                                              {:session-id expected-session-id
                                               :task-id (:id task)
                                               :error (str error)})
                                   nil)))]
            nil))
        nil))))

(defn- existing-checkpoint-payload
  [session reason]
  (let [task-checkpoint (some-> (session-task session) :sandbox-checkpoint)
        task-snapshot-id (some-> (:snapshot-id task-checkpoint) str string/trim not-empty)
        runtime-checkpoint (runtime-checkpoint-payload (:runtime session) (:runtime session) nil)
        checkpoint (if (string? task-snapshot-id)
                     task-checkpoint
                     runtime-checkpoint)]
    (checkpoint-payload-with-reason checkpoint reason)))

(defn- <checkpoint-existing-snapshot!
  [^js self current-session {:keys [by reason head-branch]}]
  (-> (p/let [d1-checkpoint (-> (checkpoint-store/<load-checkpoint-for-task! (.-env self)
                                                                             (session-task current-session))
                                (p/catch (fn [error]
                                           (log/error :agent/checkpoint-d1-load-failed
                                                      {:session-id (:id current-session)
                                                       :task-id (get-in current-session [:task :id])
                                                       :error (str error)})
                                           nil)))
              checkpoint (or (existing-checkpoint-payload current-session reason)
                             (checkpoint-payload-with-reason d1-checkpoint reason))
              _ (<append-event! self {:type "sandbox.checkpoint.started"
                                      :data (cond-> {}
                                              (string? by) (assoc :by by)
                                              (string? reason) (assoc :reason reason))
                                      :ts (common/now-ms)})]
        (if (map? checkpoint)
          (p/let [checkpoint checkpoint
                  _ (<persist-session-checkpoint! self (:id current-session) checkpoint)
                  _ (<append-event! self {:type "sandbox.checkpoint.succeeded"
                                          :data (checkpoint-event-data checkpoint
                                                                       (cond-> {:reused true}
                                                                         (string? by) (assoc :by by)
                                                                         (string? reason) (assoc :reason reason)))
                                          :ts (common/now-ms)})]
            true)
          (p/let [_ (<append-event! self {:type "sandbox.checkpoint.failed"
                                          :data (cond-> {:error "missing existing checkpoint snapshot"}
                                                  (string? by) (assoc :by by)
                                                  (string? reason) (assoc :reason reason))
                                          :ts (common/now-ms)})]
            false)))
      (p/catch (fn [error]
                 (log/error :agent/checkpoint-existing-snapshot-failed
                            {:session-id (:id current-session)
                             :runtime-session-id (get-in current-session [:runtime :session-id])
                             :sandbox-id (get-in current-session [:runtime :sandbox-id])
                             :error (str error)})
                 nil))))

(defn- stream-url [request session-id]
  (let [base (or (header request "x-stream-base")
                 (.-origin (platform/request-url request)))]
    (str base "/sessions/" session-id "/stream")))

(defn- broadcast-event! [^js self event]
  (let [streams (.-streams self)
        payload (sse-bytes event)]
    (when streams
      (.forEach streams
                (fn [writer key]
                  (-> (.write writer payload)
                      (.catch (fn [_]
                                (.delete streams key)))))))))

(defn- <append-event! [^js self event-opts]
  (p/let [session (<get-session self)]
    (if (nil? session)
      {:error :missing-session}
      (let [[session _ event] (session/append-event session [] event-opts)]
        (p/let [_ (<append-event-storage! self event)
                _ (<put-session! self session)]
          (broadcast-event! self event)
          {:session session :event event})))))

(defn- <append-publish-event!
  [^js self event-type data]
  (<append-event! self {:type event-type
                        :data data
                        :ts (common/now-ms)}))

(defn- session-conflict [message]
  (http/error-response message 409))

(defn- terminal-status? [status]
  (contains? #{"completed" "failed" "canceled"} status))

(defn- non-writable-status?
  [status]
  (contains? #{"failed" "canceled"} status))

(defn- resumable-status?
  [status]
  (contains? #{"completed" "failed" "canceled"} status))

(defn- resume-reason-for-status
  [status]
  (case status
    "completed" "resume-after-completed"
    "failed" "resume-after-failed"
    "canceled" "resume-after-canceled"
    "resume-after-terminal"))

(defn- <maybe-resume-session-for-message!
  [^js self current-session user-id]
  (if (and (map? current-session)
           (resumable-status? (:status current-session)))
    (p/let [_ (<append-event! self {:type "session.running"
                                    :data {:by user-id
                                           :reason (resume-reason-for-status (:status current-session))}
                                    :ts (common/now-ms)})
            resumed-session (<get-session self)]
      resumed-session)
    (p/resolved current-session)))

(defn- session-runtime-provider [session]
  (some-> (get-in session [:runtime :provider]) str string/lower-case))

(defn- session-terminal-enabled? [session]
  (runtime-provider/runtime-terminal-supported? (:runtime session)))

(defn- session-capabilities
  [session]
  (merge {:push-enabled true
          :pr-enabled true}
         (when (map? (:capabilities (:task session)))
           (:capabilities (:task session)))))

(defn- push-enabled?
  [session]
  (true? (:push-enabled (session-capabilities session))))

(defn- pr-enabled?
  [session]
  (true? (:pr-enabled (session-capabilities session))))

(defn- repo-url-from-session
  [session]
  (some-> (get-in session [:task :project :repo-url]) str string/trim not-empty))

(defn- repo-url-from-request
  [request]
  (some-> (platform/request-url request)
          .-searchParams
          (.get "repo-url")
          str
          string/trim
          not-empty))

(def ^:private default-pr-title-max-len 72)
(def ^:private default-head-branch-slug-max-len 54)

(defn- clean-summary-line
  [line]
  (-> (or line "")
      string/trim
      (string/replace #"^#{1,6}\s+" "")
      (string/replace #"^[-*+]\s+" "")
      (string/replace #"^\d+\.\s+" "")
      string/trim))

(defn- first-summary-line
  [text]
  (some->> (some-> text
                   str
                   (string/replace #"\r\n?" "\n")
                   (string/split #"\n"))
           (map clean-summary-line)
           (remove string/blank?)
           first))

(defn- truncate-pr-title
  [title]
  (let [trimmed (some-> title string/trim not-empty)]
    (cond
      (not (string? trimmed)) nil
      (<= (count trimmed) default-pr-title-max-len) trimmed
      :else (str (subs trimmed 0 (- default-pr-title-max-len 3)) "..."))))

(defn- description->pr-title
  [description]
  (some-> (first-summary-line description)
          truncate-pr-title))

(defn- branch-slugify
  [text]
  (some-> text
          str
          string/lower-case
          (string/replace #"['`\"]+" "")
          (string/replace #"[^a-z0-9]+" "-")
          (string/replace #"-+" "-")
          (string/replace #"^-+" "")
          (string/replace #"-+$" "")
          not-empty))

(defn- truncate-branch-slug
  [slug max-len]
  (let [slug (some-> slug str string/trim not-empty)
        max-len (max 1 (or max-len 1))]
    (when slug
      (if (<= (count slug) max-len)
        slug
        (some-> (subs slug 0 max-len)
                (string/replace #"-+$" "")
                not-empty)))))

(defn- infer-branch-prefix
  [texts]
  (let [haystack (->> texts
                      (remove nil?)
                      (map str)
                      (string/join " ")
                      string/lower-case)]
    (cond
      (re-find #"\b(fix|bug|issue|error|hotfix|regression|broken|crash)\b" haystack) "fix"
      (re-find #"\b(perf|performance|optimi[sz]e|latency|faster|speed|throughput)\b" haystack) "perf"
      :else "feat")))

(defn- session-branch-suffix
  [session-id]
  (let [normalized (some-> session-id
                           str
                           string/lower-case
                           (string/replace #"[^a-z0-9]+" ""))]
    (if (string/blank? normalized)
      "session"
      (subs normalized 0 (min 8 (count normalized))))))

(defn- generated-head-branch
  [session body]
  (let [session-id (:id session)
        task-title (or (some-> (get-in session [:task :node-title]) str string/trim not-empty)
                       (some-> (get-in session [:task :project :title]) str string/trim not-empty))
        pr-title (some-> (:title body) str string/trim not-empty)
        pr-summary (or (description->pr-title (:body body))
                       (first-summary-line (:body body)))
        prefix (infer-branch-prefix [task-title pr-title pr-summary])
        slug-parts (->> [task-title pr-title pr-summary]
                        (map branch-slugify)
                        (remove string/blank?)
                        distinct)
        suffix (session-branch-suffix session-id)
        raw-slug (if (seq slug-parts)
                   (string/join "-" slug-parts)
                   "update")
        reserved (- default-head-branch-slug-max-len (inc (count suffix)))
        slug (or (truncate-branch-slug raw-slug reserved)
                 "update")]
    (str prefix "/" slug "-" suffix)))

(defn- default-base-branch
  []
  "main")

(defn- choose-base-branch
  [candidates avoid-branch]
  (let [avoid-branch (source-control/sanitize-branch-name avoid-branch)
        valid-candidates (->> candidates
                              (map source-control/sanitize-branch-name)
                              (remove nil?)
                              vec)
        pick-non-avoid (fn [xs]
                         (if (string? avoid-branch)
                           (some (fn [candidate]
                                   (when (not= candidate avoid-branch)
                                     candidate))
                                 xs)
                           (first xs)))
        fallback-non-avoid (pick-non-avoid ["main" "master"])]
    (or (pick-non-avoid valid-candidates)
        fallback-non-avoid
        (first valid-candidates))))

(defn- task-requested-base-branch
  [task]
  (or (some-> (get-in task [:project :base-branch]) source-control/sanitize-branch-name)
      (some-> (get-in task [:project :branch]) source-control/sanitize-branch-name)))

(defn- github-install-required-message
  [install-url]
  (if (string? install-url)
    (str "GitHub App is not installed for this repository. Install it and retry: " install-url)
    "GitHub App is not installed for this repository. Install it and retry."))

(defn- <ensure-task-base-branch!
  [^js env task]
  (let [repo-url (some-> (get-in task [:project :repo-url]) str string/trim not-empty)
        requested-base (task-requested-base-branch task)]
    (cond
      (not (map? task))
      (p/resolved task)

      (not (map? (:project task)))
      (p/resolved task)

      (string? requested-base)
      (p/resolved (assoc-in task [:project :base-branch] requested-base))

      (not (string? repo-url))
      (p/resolved task)

      :else
      (p/let [detected-base (source-control/<default-branch! env
                                                             nil
                                                             repo-url)
              detected-base (source-control/sanitize-branch-name detected-base)
              fallback-base (source-control/sanitize-branch-name (default-base-branch))
              resolved-base (or detected-base fallback-base)]
        (if (string? resolved-base)
          (assoc-in task [:project :base-branch] resolved-base)
          task)))))

(defn- error-reason
  [error]
  (let [reason (some-> error ex-data :reason)]
    (cond
      (keyword? reason) (name reason)
      (string? reason) reason
      :else nil)))

(defn- local-runner-unavailable-error?
  [error]
  (let [reason (some-> error ex-data :reason)]
    (contains? #{:local-runner-unavailable
                 :local-runner-user-required
                 :missing-local-runner-base-url}
               reason)))

(defn- github-error-details
  [error]
  (let [{:keys [status body raw-body response-headers]} (ex-data error)]
    (cond-> {}
      (number? status) (assoc :github-status status)
      (some? body) (assoc :github-body body)
      (string? raw-body) (assoc :github-raw-body raw-body)
      (map? response-headers) (assoc :github-response-headers response-headers))))

(defn- <terminate-runtime! [^js self runtime]
  (set! (.-runtime-events-stream self) nil)
  (set! (.-runtime-events-stream-ready self) nil)
  (if-not (map? runtime)
    (p/resolved nil)
    (let [provider (runtime-provider/resolve-provider (.-env self) runtime)]
      (runtime-provider/<terminate-runtime! provider runtime))))

(defn- <cleanup-runtime-after-pr-ready!
  ([^js self]
   (<cleanup-runtime-after-pr-ready! self nil))
  ([^js self head-branch]
   (p/let [current-session (<get-session self)]
     (if-not (map? current-session)
       nil
       (let [runtime (:runtime current-session)]
         (if-not (map? runtime)
           nil
           (p/let [_ (<checkpoint-existing-snapshot! self current-session
                                                     (cond-> {:by "system"
                                                              :reason "pr-ready"}
                                                       (string? head-branch)
                                                       (assoc :head-branch head-branch)))
                   terminated? (-> (<terminate-runtime! self runtime)
                                   (p/then (fn [_] true))
                                   (p/catch (fn [error]
                                              (log/error :agent/pr-runtime-terminate-failed
                                                         {:session-id (:id current-session)
                                                          :runtime-session-id (:session-id runtime)
                                                          :sandbox-id (:sandbox-id runtime)
                                                          :error error})
                                              false)))
                   latest-session (<get-session self)]
             (when (and terminated?
                        (map? latest-session)
                        (map? (:runtime latest-session)))
               (<save-session! self (assoc latest-session :runtime nil))))))))))

(defn- <checkpoint-and-terminate-completed-runtime!
  [^js self session-id]
  (p/let [current-session (<get-session self)]
    (when (and (map? current-session)
               (= session-id (:id current-session))
               (= "completed" (:status current-session))
               (map? (:runtime current-session)))
      (let [runtime (:runtime current-session)]
        (p/let [_ (<checkpoint-existing-snapshot! self current-session {:by "system"
                                                                        :reason "session-completed"})
                terminated? (-> (<terminate-runtime! self runtime)
                                (p/then (fn [_] true))
                                (p/catch (fn [error]
                                           (log/error :agent/completed-runtime-terminate-failed
                                                      {:session-id session-id
                                                       :runtime-session-id (:session-id runtime)
                                                       :sandbox-id (:sandbox-id runtime)
                                                       :error error})
                                           false)))
                latest-session (<get-session self)]
          (when (and terminated?
                     (map? latest-session)
                     (= session-id (:id latest-session))
                     (map? (:runtime latest-session)))
            (<save-session! self (assoc latest-session :runtime nil))))))))

(defn- <terminate-runtime-on-status!
  [^js self session-id status]
  (p/let [current-session (<get-session self)]
    (when (and (map? current-session)
               (= session-id (:id current-session))
               (= status (:status current-session))
               (map? (:runtime current-session)))
      (let [runtime (:runtime current-session)]
        (p/let [terminated? (-> (<terminate-runtime! self runtime)
                                (p/then (fn [_] true))
                                (p/catch (fn [error]
                                           (log/error :agent/runtime-status-terminate-failed
                                                      {:session-id session-id
                                                       :status status
                                                       :runtime-session-id (:session-id runtime)
                                                       :sandbox-id (:sandbox-id runtime)
                                                       :error error})
                                           false)))
                latest-session (<get-session self)]
          (when (and terminated?
                     (map? latest-session)
                     (= session-id (:id latest-session))
                     (map? (:runtime latest-session)))
            (<save-session! self (assoc latest-session :runtime nil))))))))

(defn- parse-sse-data [frame]
  (let [lines (string/split frame #"\n")
        data-lines (keep (fn [line]
                           (when (string/starts-with? line "data:")
                             (string/trim (subs line 5))))
                         lines)
        payload (string/join "\n" data-lines)]
    (when (seq payload)
      (try
        (js->clj (js/JSON.parse payload) :keywordize-keys true)
        (catch :default _
          {:raw payload})))))

(defn- <append-runtime-event! [^js self session-id payload]
  (p/let [current-session (<get-session self)]
    (when (= session-id (:id current-session))
      (let [event-type (or (:type payload) "agent.runtime")]
        (p/let [_ (<append-event! self {:type event-type
                                        :data payload
                                        :ts (common/now-ms)})]
          (when (= "session.completed" event-type)
            (<checkpoint-and-terminate-completed-runtime! self session-id))
          (when (= "session.canceled" event-type)
            (<terminate-runtime-on-status! self session-id "canceled")))))))

(defn- <consume-events-stream! [^js self session-id runtime on-ready]
  (let [provider (runtime-provider/resolve-provider (.-env self) runtime)]
    (p/let [resp (runtime-provider/<open-events-stream! provider runtime)
            reader (.getReader (.-body resp))]
      (when (fn? on-ready)
        (on-ready))
      (let [decoder (js/TextDecoder.)
            buffer (atom "")]
        (letfn [(emit-frame! [frame]
                  (when-let [payload (parse-sse-data frame)]
                    (<append-runtime-event! self session-id payload)))
                (drain-buffer! []
                  (loop []
                    (let [idx (.indexOf ^string @buffer "\n\n")]
                      (when (>= idx 0)
                        (let [frame (subs @buffer 0 idx)]
                          (reset! buffer (subs @buffer (+ idx 2)))
                          (emit-frame! frame)
                          (recur))))))
                (step! []
                  (p/let [chunk (.read reader)]
                    (if (.-done chunk)
                      nil
                      (do
                        (swap! buffer str (string/replace (.decode decoder (.-value chunk) #js {:stream true})
                                                          #"\r\n" "\n"))
                        (drain-buffer!)
                        (step!)))))]
          (step!))))))

(defn- start-runtime-events-stream! [^js self session-id runtime]
  (when (and (map? runtime)
             (string? (:session-id runtime))
             (nil? (.-runtime-events-stream self)))
    (let [ready-state (atom {:resolve nil
                             :resolved? false})
          ready-promise (js/Promise.
                         (fn [resolve _reject]
                           (swap! ready-state assoc :resolve resolve)))
          resolve-ready! (fn [value]
                           (let [{:keys [resolve resolved?]} @ready-state]
                             (when (and (fn? resolve) (not resolved?))
                               (swap! ready-state assoc :resolved? true)
                               (resolve value))))
          stream-task (-> (<consume-events-stream! self
                                                   session-id
                                                   runtime
                                                   #(resolve-ready! :ready))
                          (.catch (fn [error]
                                    (resolve-ready! :error)
                                    (p/let [latest-session (<get-session self)
                                            latest-runtime-session-id (some-> latest-session :runtime :session-id)
                                            same-runtime? (and (map? latest-session)
                                                               (= session-id (:id latest-session))
                                                               (= (:session-id runtime) latest-runtime-session-id))
                                            session-terminal? (terminal-status? (:status latest-session))]
                                      (if (and same-runtime? (not session-terminal?))
                                        (do
                                          (log/error :agent/runtime-events-stream-error
                                                     {:session-id session-id
                                                      :runtime-session-id (:session-id runtime)
                                                      :error error})
                                          (<append-event! self {:type "agent.runtime.error"
                                                                :data {:session-id session-id
                                                                       :message (str error)}
                                                                :ts (common/now-ms)}))
                                        (do
                                          (log/info :agent/runtime-events-stream-closed
                                                    {:session-id session-id
                                                     :runtime-session-id (:session-id runtime)
                                                     :reason :runtime-no-longer-active})
                                          nil))))))]
      (set! (.-runtime-events-stream-ready self) ready-promise)
      (set! (.-runtime-events-stream self)
            (.finally stream-task
                      (fn []
                        (resolve-ready! :closed)
                        (set! (.-runtime-events-stream self) nil)
                        (set! (.-runtime-events-stream-ready self) nil))))
      ready-promise)))

(defn- <await-events-stream-ready
  [ready-promise timeout-ms]
  (if-not ready-promise
    (p/resolved :no-stream)
    (js/Promise.race
     #js [(js/Promise.resolve ready-promise)
          (js/Promise.
           (fn [resolve _reject]
             (js/setTimeout
              (fn [] (resolve :timeout))
              timeout-ms)))])))

(defn- ensure-runtime-events-stream-ready!
  [^js self session-id runtime]
  (when (and (map? runtime)
             (string? (:session-id runtime)))
    (when (nil? (.-runtime-events-stream self))
      (start-runtime-events-stream! self session-id runtime))
    (.-runtime-events-stream-ready self)))

(def ^:private events-stream-ready-timeout-ms 1000)

(defn- runtime-ready?
  [runtime]
  (and (map? runtime)
       (string? (:session-id runtime))))

(declare <provision-runtime!)

(defn- <ensure-runtime-for-session!
  [^js self current-session]
  (if-not (map? current-session)
    (p/resolved current-session)
    (let [runtime (:runtime current-session)
          session-id (:id current-session)]
      (if (runtime-ready? runtime)
        (p/resolved current-session)
        (p/let [_ (<provision-runtime! self (:task current-session) session-id)
                refreshed-session (<get-session self)]
          refreshed-session)))))

(defn- start-runtime-events-stream-background! [^js self session-id runtime]
  ;; Fire-and-forget start. Returning nil avoids p/let awaiting the stream task.
  (when (and (map? runtime)
             (string? (:session-id runtime)))
    (ensure-runtime-events-stream-ready! self session-id runtime)
    nil))

(defn- send-runtime-message!
  [^js self current-session runtime provider message kind]
  (let [session-id (:id current-session)
        send-once! (fn [session-value]
                     (let [runtime-value (:runtime session-value)
                           provider-value (when (runtime-ready? runtime-value)
                                            (runtime-provider/resolve-provider (.-env self) runtime-value))]
                       (if-not (and provider-value (runtime-ready? runtime-value))
                         (p/rejected (ex-info "session runtime unavailable"
                                              {:session-id (:id session-value)}))
                         (let [ready-promise (ensure-runtime-events-stream-ready! self (:id session-value) runtime-value)]
                           (-> (<await-events-stream-ready ready-promise events-stream-ready-timeout-ms)
                               (.then (fn [_]
                                        (runtime-provider/<send-message! provider-value
                                                                         runtime-value
                                                                         {:message message
                                                                          :kind kind}))))))))
        retry-send! (fn [error]
                      (p/let [latest-session (<get-session self)]
                        (if (or (not (map? latest-session))
                                (not= session-id (:id latest-session))
                                (non-writable-status? (:status latest-session)))
                          (p/rejected error)
                          (let [latest-runtime (:runtime latest-session)
                                failed-runtime-id (some-> (:session-id runtime) str)
                                latest-runtime-id (some-> (:session-id latest-runtime) str)
                                same-runtime? (and (string? failed-runtime-id)
                                                   (= failed-runtime-id latest-runtime-id))]
                            (p/let [_ (when same-runtime?
                                        (<save-session! self (assoc latest-session :runtime nil)))
                                    retry-session (if same-runtime?
                                                    (<get-session self)
                                                    latest-session)
                                    session-with-runtime (<ensure-runtime-for-session! self retry-session)]
                              (send-once! session-with-runtime))))))]
    (-> (send-once! current-session)
        (p/catch retry-send!)
        (p/catch (fn [error]
                   (log/error :agent/runtime-message-error
                              {:session-id session-id
                               :runtime-session-id (:session-id runtime)
                               :error error})
                   (<append-event! self {:type "agent.runtime.error"
                                         :data {:session-id session-id
                                                :message (str error)}
                                         :ts (common/now-ms)})))
        (.catch (fn [_] nil)))))

(defn- send-runtime-message-background!
  [^js self current-session _runtime _provider message kind]
  (when (map? current-session)
    (send-runtime-message! self current-session _runtime _provider message kind)
    nil))

(defn- <transition! [^js self to-status event-type data]
  (p/let [session (<get-session self)]
    (cond
      (nil? session)
      (http/not-found)

      (not (session/transition-allowed? (:status session) to-status))
      (session-conflict (str "cannot transition from " (:status session) " to " to-status))

      :else
      (p/let [res (<append-event! self {:type event-type :data data})]
        (if (= (:error res) :missing-session)
          (http/not-found)
          (http/json-response :sessions/pause {:ok true}))))))

(defn- non-empty-str
  [value]
  (when (string? value)
    (let [trimmed (string/trim value)]
      (when-not (string/blank? trimmed)
        trimmed))))

(defn- task-runtime-provider
  [task]
  (or (some-> (:runtime-provider task) non-empty-str string/lower-case)
      (some-> (get-in task [:runtime :provider]) non-empty-str string/lower-case)))

(defn- session-requested-by
  [session]
  (some-> (get-in session [:audit :requested-by]) non-empty-str))

(defn- <attach-local-runner!
  [^js env task requested-by]
  (let [requested-runner-id (some-> (:runner-id task) non-empty-str)]
    (if-not (string? requested-by)
      (p/rejected (ex-info "local runner requires authenticated user"
                           {:reason :local-runner-user-required}))
      (p/let [runner (runner-store/<select-runner-for-user! env requested-by requested-runner-id)]
        (if-not (map? runner)
          (p/rejected (ex-info "local runner unavailable"
                               {:reason :local-runner-unavailable
                                :user-id requested-by
                                :runner-id requested-runner-id}))
          (assoc task :runner runner))))))

(defn- <provision-runtime! [^js self task session-id]
  (p/let [session-before (<get-session self)
          requested-by (session-requested-by session-before)
          runtime-request {:provider (task-runtime-provider task)}
          provider (runtime-provider/resolve-provider (.-env self) runtime-request)
          provider-kind (runtime-provider/provider-id provider)
          base-task (if (map? task) (dissoc task :sandbox-checkpoint) task)
          d1-checkpoint (if (map? base-task)
                          (-> (checkpoint-store/<load-checkpoint-for-task! (.-env self) base-task)
                              (p/catch (fn [error]
                                         (log/error :agent/provision-checkpoint-d1-load-failed
                                                    {:session-id session-id
                                                     :task-id (:id base-task)
                                                     :error (str error)})
                                         nil)))
                          nil)
          task (if (and (map? base-task) (map? d1-checkpoint))
                 (assoc base-task :sandbox-checkpoint d1-checkpoint)
                 base-task)
          task (if (= "local-runner" provider-kind)
                 (<attach-local-runner! (.-env self) task requested-by)
                 task)
          runtime (runtime-provider/<provision-runtime! provider session-id task)
          session (<get-session self)]
    (cond
      (nil? runtime)
      (throw (ex-info "runtime provisioning returned nil"
                      {:session-id session-id
                       :provider provider-kind}))

      (nil? session)
      nil

      :else
      (let [base-checkpoint (or (runtime-checkpoint-payload runtime runtime "provisioned")
                                (checkpoint-payload-with-reason d1-checkpoint "provisioned"))
            runtime-checkpoint base-checkpoint
            session (-> session
                        (assoc :runtime runtime)
                        (cond-> (map? runtime-checkpoint)
                          (assoc-in [:task :sandbox-checkpoint] runtime-checkpoint)))
            [session _ event] (session/append-event session [] {:type "session.provisioned"
                                                                :data {:provider (:provider runtime)
                                                                       :runtime-session-id (:session-id runtime)
                                                                       :runner-id (:runner-id runtime)
                                                                       :sandbox-id (:sandbox-id runtime)
                                                                       :sandbox-name (:sandbox-name runtime)
                                                                       :sprite-name (:sprite-name runtime)}
                                                                :ts (common/now-ms)})]
        (p/let [_ (<append-event-storage! self event)
                _ (<put-session! self session)]
          (when-not (terminal-status? (:status session))
            (start-runtime-events-stream-background! self (:id session) runtime))
          runtime)))))

(defn- handle-init [^js self request]
  (p/let [existing (<get-session self)]
    (if existing
      (let [session-id (:id existing)
            runtime-id (get-in existing [:runtime :session-id])]
        (p/let [_ (when-not (string? runtime-id)
                    (<provision-runtime! self (:task existing) session-id))
                current-session (<get-session self)]
          (when (and (map? (:runtime current-session))
                     (not (terminal-status? (:status current-session))))
            (start-runtime-events-stream-background! self session-id (:runtime current-session)))
          (http/json-response :sessions/create
                              {:session-id session-id
                               :status (:status current-session)
                               :runtime-provider (session-runtime-provider current-session)
                               :terminal-enabled (session-terminal-enabled? current-session)
                               :stream-url (stream-url request session-id)})))
      (.then (common/read-json request)
             (fn [result]
               (if (nil? result)
                 (http/bad-request "missing body")
                 (let [task (js->clj result :keywordize-keys true)
                       task-id (:id task)
                       user-id (user-id-from-request request)
                       now (common/now-ms)
                       audit-default {:requested-by user-id
                                      :requested-at now}
                       audit (merge audit-default (:audit task))]
                   (cond
                     (not (string? user-id))
                     (http/unauthorized)

                     (not (string? task-id))
                     (http/bad-request "invalid session id")

                     (and (string? (:requested-by audit))
                          (not= (:requested-by audit) user-id))
                     (http/forbidden)

                     :else
                     (p/let [repo-url (some-> (get-in task [:project :repo-url]) str string/trim not-empty)
                             install-status (-> (if (string? repo-url)
                                                  (source-control/<repo-installation-status! (.-env self) repo-url)
                                                  (p/resolved {:installed? true}))
                                                (p/catch (fn [error]
                                                           {:error error})))]
                       (if (:error install-status)
                         (http/error-response "failed to verify GitHub App installation" 500)
                         (if (and (map? install-status)
                                  (false? (:installed? install-status)))
                           (http/error-response (github-install-required-message (:install-url install-status)) 412)
                           (p/let [task (<ensure-task-base-branch! (.-env self) task)]
                             (let [session (session/initial-session task audit now)
                                   [session events _event]
                                   (session/append-event session [] {:type "session.created"
                                                                     :data {:requested-by user-id
                                                                            :project (:project task)
                                                                            :agent (:agent task)}
                                                                     :ts now})]
                               (p/let [_ (<put-session! self session)
                                       _ (<put-events! self events)
                                       provision-result (-> (<provision-runtime! self task task-id)
                                                            (p/then (fn [_] {:ok true}))
                                                            (p/catch (fn [error]
                                                                       {:error error})))
                                       updated-session (<get-session self)]
                                 (if-let [error (:error provision-result)]
                                   (if (local-runner-unavailable-error? error)
                                     (session-conflict "local runner unavailable, register or heartbeat your runner and retry")
                                     (throw error))
                                   (http/json-response :sessions/create
                                                       {:session-id task-id
                                                        :status (or (:status updated-session)
                                                                    (:status session))
                                                        :runtime-provider (session-runtime-provider updated-session)
                                                        :terminal-enabled (session-terminal-enabled? updated-session)
                                                        :stream-url (stream-url request task-id)}))))))))))))))))

(defn- handle-status [^js self _request]
  (p/let [session (<get-session self)]
    (if (nil? session)
      (http/not-found)
      (http/json-response :sessions/get
                          {:session-id (:id session)
                           :status (:status session)
                           :runtime-provider (session-runtime-provider session)
                           :terminal-enabled (session-terminal-enabled? session)
                           :task (:task session)
                           :audit (:audit session)
                           :created-at (:created-at session)
                           :updated-at (:updated-at session)}))))

(defn- handle-messages [^js self request]
  (.then (common/read-json request)
         (fn [result]
           (if (nil? result)
             (http/bad-request "missing body")
             (let [body (js->clj result :keywordize-keys true)
                   message (:message body)
                   user-id (user-id-from-request request)]
               (cond
                 (not (string? user-id))
                 (http/unauthorized)

                 (not (string? message))
                 (http/bad-request "invalid message")

                 :else
                 (p/let [res (<append-event! self {:type "audit.log"
                                                   :data {:event "user-message"
                                                          :kind (:kind body)
                                                          :by user-id}})
                         session-before (<get-session self)
                         current-session (<maybe-resume-session-for-message! self session-before user-id)]
                   (cond
                     (= (:error res) :missing-session)
                     (http/not-found)

                     (non-writable-status? (:status current-session))
                     (session-conflict "session is not writable")

                     (= "paused" (:status current-session))
                     (let [next-session (session/enqueue-order current-session {:message message
                                                                                :kind (:kind body)
                                                                                :by user-id})]
                       (p/let [_ (<save-session! self next-session)]
                         (http/json-response :sessions/message {:ok true})))

                     :else
                     (let [runtime (:runtime current-session)
                           provider (when runtime
                                      (runtime-provider/resolve-provider (.-env self) runtime))]
                       (send-runtime-message-background! self
                                                         current-session
                                                         runtime
                                                         provider
                                                         message
                                                         (:kind body))
                       (http/json-response :sessions/message {:ok true}))))))))))

(defn- <manual-pr-required-response!
  [^js self {:keys [user-id head-branch base-branch manual-url reason force? message
                    github-status github-body github-raw-body github-response-headers]}]
  (p/let [_ (<append-publish-event! self "git.pr.manual"
                                    {:by user-id
                                     :head-branch head-branch
                                     :base-branch base-branch
                                     :manual-pr-url manual-url
                                     :reason reason})]
    (http/json-response :sessions/pr
                        (cond-> {:status "manual-pr-required"
                                 :head-branch head-branch}
                          (string? base-branch) (assoc :base-branch base-branch)
                          (string? manual-url) (assoc :manual-pr-url manual-url)
                          (some? force?) (assoc :force force?)
                          (string? message) (assoc :message message)
                          (number? github-status) (assoc :github-status github-status)
                          (some? github-body) (assoc :github-body github-body)
                          (string? github-raw-body) (assoc :github-raw-body github-raw-body)
                          (map? github-response-headers) (assoc :github-response-headers github-response-headers)))))

(defn- <create-pr-response!
  [^js self {:keys [user-id repo-url head-branch base-branch title description pr-token force? manual-url]}]
  (-> (p/let [_ (<append-publish-event! self "git.pr.started"
                                        {:by user-id
                                         :head-branch head-branch
                                         :base-branch base-branch})
              pr-result (source-control/<create-pull-request! (.-env self)
                                                              pr-token
                                                              repo-url
                                                              {:title title
                                                               :body description
                                                               :head-branch head-branch
                                                               :base-branch base-branch})
              _ (<append-publish-event! self "git.pr.succeeded"
                                        {:by user-id
                                         :head-branch head-branch
                                         :base-branch base-branch
                                         :pr-url (:url pr-result)
                                         :pr-id (:id pr-result)})
              _ (<cleanup-runtime-after-pr-ready! self head-branch)]
        (http/json-response :sessions/pr
                            (cond-> {:status "pr-created"
                                     :head-branch head-branch
                                     :message "branch pushed and pull request created"}
                              (string? base-branch) (assoc :base-branch base-branch)
                              (string? (:url pr-result)) (assoc :pr-url (:url pr-result))
                              (some? force?) (assoc :force force?))))
      (p/catch (fn [error]
                 (let [reason (error-reason error)
                       {:keys [github-status github-body github-raw-body github-response-headers]} (github-error-details error)]
                   (p/let [existing-pr (when (= reason "api-error")
                                         (source-control/<find-open-pull-request! (.-env self)
                                                                                  pr-token
                                                                                  repo-url
                                                                                  {:head-branch head-branch
                                                                                   :base-branch base-branch}))]
                     (if (map? existing-pr)
                       (p/let [_ (<append-publish-event! self "git.pr.succeeded"
                                                         {:by user-id
                                                          :head-branch head-branch
                                                          :base-branch (or (:base-branch existing-pr) base-branch)
                                                          :pr-url (:url existing-pr)
                                                          :pr-id (:id existing-pr)
                                                          :existing true})
                               _ (<cleanup-runtime-after-pr-ready! self head-branch)]
                         (http/json-response :sessions/pr
                                             (cond-> {:status "pr-created"
                                                      :head-branch head-branch
                                                      :message "branch pushed; existing pull request found"}
                                               (string? (or (:base-branch existing-pr) base-branch))
                                               (assoc :base-branch (or (:base-branch existing-pr) base-branch))
                                               (string? (:url existing-pr)) (assoc :pr-url (:url existing-pr))
                                               (some? force?) (assoc :force force?))))
                       (p/let [_ (<append-publish-event! self "git.pr.failed"
                                                         {:by user-id
                                                          :head-branch head-branch
                                                          :base-branch base-branch
                                                          :reason reason
                                                          :error (str error)
                                                          :github-status github-status})]
                         (<manual-pr-required-response! self
                                                        (cond-> {:user-id user-id
                                                                 :head-branch head-branch
                                                                 :base-branch base-branch
                                                                 :manual-url manual-url
                                                                 :reason "api-failed"
                                                                 :force? force?
                                                                 :message "branch pushed; pull request API failed, use manual URL"}
                                                          (number? github-status) (assoc :github-status github-status)
                                                          (some? github-body) (assoc :github-body github-body)
                                                          (string? github-raw-body) (assoc :github-raw-body github-raw-body)
                                                          (map? github-response-headers) (assoc :github-response-headers github-response-headers)))))))))))

(defn- <handle-pr-after-push!
  [^js self current-session body user-id repo-url head-branch force? create-pr?]
  (let [requested-base-branch (source-control/sanitize-branch-name (:base-branch body))
        task-base-branch (some-> (get-in current-session [:task :project :base-branch])
                                 source-control/sanitize-branch-name)
        default-base (source-control/sanitize-branch-name (default-base-branch))]
    (cond
      (false? create-pr?)
      (let [base-branch (choose-base-branch [requested-base-branch
                                             task-base-branch
                                             default-base]
                                            nil)]
        (http/json-response :sessions/pr
                            (cond-> {:status "pushed"
                                     :head-branch head-branch
                                     :message "branch pushed"}
                              (string? base-branch) (assoc :base-branch base-branch)
                              (some? force?) (assoc :force force?))))

      (not (pr-enabled? current-session))
      (http/forbidden)

      :else
      (p/let [pr-token (source-control/<pr-token! (.-env self) repo-url)
              detected-base-branch (source-control/<default-branch! (.-env self)
                                                                    pr-token
                                                                    repo-url)
              base-branch (choose-base-branch [detected-base-branch
                                               requested-base-branch
                                               task-base-branch
                                               default-base]
                                              head-branch)]
        (let [description (or (some-> (:body body) str string/trim not-empty)
                              "Automated changes from agent session.")
              title (or (some-> (:title body) str string/trim not-empty)
                        (description->pr-title description)
                        (str "Agent updates for session " (:id current-session)))
              manual-url (source-control/manual-pr-url repo-url head-branch base-branch)]
          (<create-pr-response! self
                                {:user-id user-id
                                 :repo-url repo-url
                                 :head-branch head-branch
                                 :base-branch base-branch
                                 :title title
                                 :description description
                                 :pr-token pr-token
                                 :force? force?
                                 :manual-url manual-url}))))))

(defn- <perform-pr-push!
  [^js self current-session body user-id repo-url runtime force? create-pr? push-branch-fn]
  (let [provider (runtime-provider/resolve-provider (.-env self) runtime)
        env (.-env self)
        commit-message (some-> (:commit-message body) str string/trim not-empty)
        requested-base-branch (source-control/sanitize-branch-name (:base-branch body))
        task-base-branch (some-> (get-in current-session [:task :project :base-branch])
                                 source-control/sanitize-branch-name)
        checkpoint-head-branch (or (some-> (get-in current-session [:task :sandbox-checkpoint :bundle-head-branch])
                                           source-control/sanitize-branch-name)
                                   (some-> (get-in current-session [:task :sandbox-checkpoint :head-branch])
                                           source-control/sanitize-branch-name))
        default-base (source-control/sanitize-branch-name (default-base-branch))
        push-base-branch (choose-base-branch [requested-base-branch
                                              task-base-branch
                                              default-base]
                                             nil)
        generated-branch (generated-head-branch current-session body)
        resolved-head-branch (if create-pr?
                               (source-control/resolve-head-branch (:head-branch body)
                                                                   generated-branch)
                               (source-control/resolve-head-branch (:head-branch body)
                                                                   (or checkpoint-head-branch
                                                                       push-base-branch)))
        head-branch (if (and create-pr?
                             (string? resolved-head-branch)
                             (string? push-base-branch)
                             (= resolved-head-branch push-base-branch))
                      (source-control/resolve-head-branch nil generated-branch)
                      resolved-head-branch)]
    (if-not (string? head-branch)
      (http/bad-request "invalid head branch")
      (-> (p/let [push-token (source-control/<push-token! env repo-url)
                  _ (<append-publish-event! self "git.push.started"
                                            {:by user-id
                                             :head-branch head-branch
                                             :force force?})
                  push-result (push-branch-fn provider
                                              runtime
                                              (cond-> {:session-id (:id current-session)
                                                       :task (:task current-session)
                                                       :repo-url repo-url
                                                       :head-branch head-branch
                                                       :force force?
                                                       :push-token push-token}
                                                commit-message (assoc :commit-message commit-message)))
                  _ (<append-publish-event! self "git.push.succeeded"
                                            {:by user-id
                                             :head-branch head-branch
                                             :force force?
                                             :remote (:remote push-result)})]
            (<handle-pr-after-push! self
                                    current-session
                                    body
                                    user-id
                                    repo-url
                                    head-branch
                                    force?
                                    create-pr?))
          (p/catch (fn [error]
                     (p/let [_ (<append-publish-event! self "git.push.failed"
                                                       {:by user-id
                                                        :head-branch head-branch
                                                        :reason (error-reason error)
                                                        :error (str error)})]
                       (http/error-response (str error) 500))))))))

(defn- handle-pr [^js self request]
  (let [push-branch-fn runtime-provider/<push-branch!]
    (.then (common/read-json request)
           (fn [result]
             (let [body (if (nil? result)
                          {}
                          (js->clj result :keywordize-keys true))
                   user-id (user-id-from-request request)
                   force? (true? (:force body))
                   create-pr? (if (contains? body :create-pr)
                                (true? (:create-pr body))
                                true)]
               (if-not (string? user-id)
                 (http/unauthorized)
                 (p/let [current-session (<get-session self)]
                   (cond
                     (nil? current-session)
                     (http/not-found)

                     (terminal-status? (:status current-session))
                     (session-conflict "session is not writable")

                     (not (push-enabled? current-session))
                     (http/forbidden)

                     :else
                     (let [repo-url (repo-url-from-session current-session)
                           runtime (:runtime current-session)]
                       (cond
                         (not (string? repo-url))
                         (http/bad-request "missing repo url")

                         (not (map? runtime))
                         (session-conflict "session runtime unavailable")

                         :else
                         (<perform-pr-push! self
                                            current-session
                                            body
                                            user-id
                                            repo-url
                                            runtime
                                            force?
                                            create-pr?
                                            push-branch-fn)))))))))))

(defn- handle-snapshot [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [current-session (<get-session self)]
        (cond
          (nil? current-session)
          (http/not-found)

          (terminal-status? (:status current-session))
          (session-conflict "session is not writable")

          (not (map? (:runtime current-session)))
          (session-conflict "session runtime unavailable")

          :else
          (let [runtime (:runtime current-session)
                provider (runtime-provider/resolve-provider (.-env self) runtime)]
            (-> (p/let [_ (<append-event! self {:type "sandbox.snapshot.started"
                                                :data {:by user-id}
                                                :ts (common/now-ms)})
                        result (runtime-provider/<snapshot-runtime! provider
                                                                    runtime
                                                                    {:task (:task current-session)})
                        checkpoint (runtime-checkpoint-payload runtime result "manual")
                        _ (<persist-session-checkpoint! self (:id current-session) checkpoint)
                        _ (<append-event! self {:type "sandbox.snapshot.succeeded"
                                                :data (checkpoint-event-data checkpoint {:by user-id})
                                                :ts (common/now-ms)})]
                  (http/json-response :sessions/snapshot
                                      (cond-> {:status "snapshot-created"
                                               :message "Sandbox snapshot created."}
                                        (string? (runtime-snapshot-id checkpoint))
                                        (assoc :snapshot-id (runtime-snapshot-id checkpoint)))))
                (p/catch (fn [error]
                           (let [reason (error-reason error)
                                 unsupported? (= reason "unsupported-snapshot")]
                             (p/let [_ (<append-event! self {:type "sandbox.snapshot.failed"
                                                             :data {:by user-id
                                                                    :reason reason
                                                                    :error (str error)}
                                                             :ts (common/now-ms)})]
                               (if unsupported?
                                 (session-conflict (or (some-> error ex-message str string/trim not-empty)
                                                       "session runtime snapshot unavailable"))
                                 (http/error-response (str error) 500)))))))))))))

(defn- handle-cancel [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [session-before (<get-session self)]
        (if-not (map? session-before)
          (http/not-found)
          (p/let [res (<append-event! self {:type "session.canceled"
                                            :data {:by user-id}})
                  session-after (<get-session self)
                  current-session (or session-after session-before)
                  runtime (or (:runtime session-after) (:runtime session-before))
                  _ (when (and (map? current-session)
                               (map? runtime))
                      (<checkpoint-existing-snapshot! self
                                                      (assoc current-session :runtime runtime)
                                                      {:by user-id
                                                       :reason "cancel"}))
                  _ (<terminate-runtime! self runtime)
                  latest-session (<get-session self)
                  _ (when (and (map? latest-session)
                               (map? (:runtime latest-session)))
                      (<save-session! self (assoc latest-session :runtime nil)))]
            (if (= (:error res) :missing-session)
              (http/not-found)
              (http/json-response :sessions/cancel {:ok true}))))))))

(defn- <flush-pending-orders! [^js self]
  (p/let [current-session (<get-session self)]
    (if (nil? current-session)
      nil
      (p/let [session-with-runtime (<ensure-runtime-for-session! self current-session)
              runtime (:runtime session-with-runtime)]
        (if-not (runtime-ready? runtime)
          0
          (let [[orders next-session] (session/drain-orders session-with-runtime)
                provider (runtime-provider/resolve-provider (.-env self) runtime)]
            (p/let [_ (<save-session! self next-session)
                    _ (start-runtime-events-stream-background! self (:id session-with-runtime) runtime)
                    _ (p/all
                       (map (fn [order]
                              (runtime-provider/<send-message! provider
                                                               runtime
                                                               {:message (:message order)
                                                                :kind (:kind order)}))
                            orders))]
              (count orders))))))))

(defn- handle-pause [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (<transition! self "paused" "session.paused" {:by user-id :reason "user-pause"}))))

(defn- handle-resume [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [resp (<transition! self "running" "session.running" {:by user-id :reason "user-resume"})]
        (if-not (= 200 (.-status resp))
          resp
          (p/let [flushed (<flush-pending-orders! self)]
            (http/json-response :sessions/resume {:ok true
                                                  :flushed (or flushed 0)})))))))

(defn- handle-interrupt [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (<transition! self "paused" "session.paused" {:by user-id :reason "interrupt"}))))

(defn- ->promise
  [v]
  (js/Promise.resolve v))

(defn- handle-stream [^js self request]
  (let [streams (.-streams self)
        stream (js/TransformStream.)
        writer (.getWriter (.-writable stream))
        stream-id (str (random-uuid))
        closed? (volatile! false)
        cleanup (fn []
                  (when-not @closed?
                    (vreset! closed? true)
                    (.delete streams stream-id)
                    (try (.close writer) (catch :default _ nil))))]
    (.set streams stream-id writer)
    (.addEventListener (.-signal request) "abort" cleanup)

    ;; IMPORTANT: don't block returning the Response; write the initial backlog async
    (js/queueMicrotask
     (fn []
       (p/let [events (<get-events self)]
         (doseq [event events]
           ;; writer.write returns a promise; wait so order is preserved
           (p/let [_ (->promise (.write writer (sse-bytes event)))]
             nil)))))

    (js/Response.
     (.-readable stream)
     #js {:status 200
          :headers (js/Object.assign
                    #js {"content-type" "text/event-stream"
                         "cache-control" "no-cache"
                         "connection" "keep-alive"}
                    (common/cors-headers))})))

(defn- parse-int [value]
  (when (string? value)
    (let [parsed (js/parseInt value 10)]
      (when (js/Number.isFinite parsed) parsed))))

(defn- <terminal-opened-response!
  [^js self user-id cols rows response]
  (p/let [_ (<append-event! self (cond-> {:type "session.terminal.opened"
                                          :data {:by user-id}
                                          :ts (common/now-ms)}
                                   (number? cols) (assoc-in [:data :cols] cols)
                                   (number? rows) (assoc-in [:data :rows] rows)))]
    response))

(defn- terminal-error-status
  [error]
  (let [reason (some-> error ex-data :reason)]
    (if (= reason :unsupported-terminal)
      409
      500)))

(defn- terminal-error-message
  [error]
  (let [reason (some-> error ex-data :reason)]
    (if (= reason :unsupported-terminal)
      "session runtime does not support browser terminal"
      "failed to open terminal")))

(defn- <terminal-failed-response!
  [^js self user-id cols rows error]
  (p/let [_ (<append-event! self (cond-> {:type "session.terminal.failed"
                                          :data {:by user-id
                                                 :error (str error)}
                                          :ts (common/now-ms)}
                                   (number? cols) (assoc-in [:data :cols] cols)
                                   (number? rows) (assoc-in [:data :rows] rows)))]
    (http/error-response (terminal-error-message error)
                         (terminal-error-status error))))

(defn- handle-terminal [^js self request]
  (let [user-id (user-id-from-request request)
        url (platform/request-url request)
        cols (parse-int (.get (.-searchParams url) "cols"))
        rows (parse-int (.get (.-searchParams url) "rows"))]
    (if-not (string? user-id)
      (http/unauthorized)
      (p/let [current-session (<get-session self)]
        (cond
          (nil? current-session)
          (http/not-found)

          (terminal-status? (:status current-session))
          (session-conflict "session is not writable")

          (not (map? (:runtime current-session)))
          (session-conflict "session runtime unavailable")

          :else
          (let [runtime (:runtime current-session)
                provider (runtime-provider/resolve-provider (.-env self) runtime)
                opts (cond-> {}
                       (number? cols) (assoc :cols cols)
                       (number? rows) (assoc :rows rows))]
            (-> (runtime-provider/<open-terminal! provider runtime request opts)
                (p/then (fn [response]
                          (<terminal-opened-response! self user-id cols rows response)))
                (p/catch (fn [error]
                           (log/error :agent/session-terminal-open-failed
                                      {:session-id (:id current-session)
                                       :runtime-session-id (:session-id runtime)
                                       :error error})
                           (<terminal-failed-response! self user-id cols rows error))))))))))

(defn- handle-events [^js self request]
  (let [url (platform/request-url request)
        since-ts (parse-int (.get (.-searchParams url) "since"))
        limit (parse-int (.get (.-searchParams url) "limit"))
        user-id (user-id-from-request request)]
    (log/info :agent/session-events-request {:user-id user-id
                                             :since since-ts
                                             :limit limit})
    (p/let [session (<get-session self)]
      (if (nil? session)
        (http/not-found)
        (p/let [events (<get-events self)
                filtered (session/filter-events events {:since-ts since-ts :limit limit})]
          (http/json-response :sessions/events {:events filtered}))))))

(defn- handle-branches [^js self request]
  (let [user-id (user-id-from-request request)]
    (if-not (string? user-id)
      (http/unauthorized)
      (let [env (.-env self)]
        (p/let [session (<get-session self)
                repo-url (or (repo-url-from-request request)
                             (repo-url-from-session session))]
          (if-not (string? repo-url)
            (http/bad-request "missing repo url")
            (p/let [token (source-control/<push-token! env repo-url)
                    branches (source-control/<list-branches! env
                                                             token
                                                             repo-url)]
              (http/json-response :sessions/branches
                                  {:branches (->> branches
                                                  (filter string?)
                                                  vec)}))))))))

(defn handle-fetch [^js self request]
  (let [url (platform/request-url request)
        path (.-pathname url)
        method (.-method request)]
    (.catch
     (js/Promise.resolve
      (try
        (cond
          (contains? #{"OPTIONS" "HEAD"} method)
          (common/options-response)

          (= path "/__session__/init")
          (handle-init self request)

          (= path "/__session__/status")
          (handle-status self request)

          (= path "/__session__/messages")
          (handle-messages self request)

          (= path "/__session__/pause")
          (handle-pause self request)

          (= path "/__session__/resume")
          (handle-resume self request)

          (= path "/__session__/interrupt")
          (handle-interrupt self request)

          (= path "/__session__/cancel")
          (handle-cancel self request)

          (= path "/__session__/pr")
          (handle-pr self request)

          (= path "/__session__/snapshot")
          (handle-snapshot self request)

          (= path "/__session__/terminal")
          (handle-terminal self request)

          (= path "/__session__/stream")
          (handle-stream self request)

          (= path "/__session__/events")
          (handle-events self request)

          (= path "/__session__/branches")
          (handle-branches self request)

          :else
          (http/not-found))
        (catch :default error
          (log/error :agent/session-do-error error)
          (http/error-response "server error" 500))))
     (fn [error]
       (log/error :agent/session-do-error error)
       (http/error-response "server error" 500)))))
