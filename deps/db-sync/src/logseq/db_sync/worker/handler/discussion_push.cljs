(ns logseq.db-sync.worker.handler.discussion-push
  (:require ["@emoji-mart/data" :as emoji-data]
            [clojure.string :as string]
            [datascript.core :as d]
            [goog.object :as gobj]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.http :as http]
            [logseq.db.frontend.entity-util :as entity-util]
            [promesa.core :as p]))

(def device-path "/mobile/push-device")

(defn- uuid-string? [value]
  (and (string? value)
       (some? (re-matches #"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" value))))

(defn- valid-token? [platform token]
  (and (string? token)
       (case platform
         ("apns" "apns-sandbox") (some? (re-matches #"[0-9a-f]{32,256}" token))
         "fcm" (some? (re-matches #"[a-zA-Z0-9:_-]{20,4096}" token))
         false)))

(defn- statement [^js db query & arguments]
  (let [^js prepared (.prepare db query)]
    (.apply (.-bind prepared) prepared (to-array arguments))))

(defn- send-enabled? [env]
  (= "true" (aget env "DISCUSSION_PUSH_ENABLED")))

(defn <register [request env]
  (p/let [claims (auth/auth-claims request env)
          account (some-> claims (aget "sub"))
          ^js db (aget env "DB")
          method (.-method request)]
    (cond
      (not (uuid-string? account)) (http/unauthorized)
      (not (contains? #{"PUT" "DELETE"} method)) (http/not-found)
      (and (= method "PUT") (not (send-enabled? env)))
      (http/error-response "Push notifications are unavailable" 503)
      :else
      (p/let [body (common/read-json request)
              installation (some-> body (aget "installationId"))
              platform (some-> body (aget "platform"))
              token (some-> body (aget "token"))
              comments (some-> body (aget "comments"))
              reactions (some-> body (aget "reactions"))]
        (cond
          (not (uuid-string? installation)) (http/bad-request "Invalid installation")
          (= method "DELETE")
          (p/let [_ (.run (statement db
                                     "DELETE FROM discussion_push_devices WHERE installation_id = ? AND user_id = ?"
                                     installation account))]
            (js/Response. nil #js {:status 204}))
          (not (valid-token? platform token)) (http/bad-request "Invalid platform or token")
          (or (and (some? comments) (not (boolean? comments)))
              (and (some? reactions) (not (boolean? reactions))))
          (http/bad-request "Invalid notification preferences")
          :else
          (p/let [comment-flag (when (some? comments) (if comments 1 0))
                  reaction-flag (when (some? reactions) (if reactions 1 0))
                  _ (.batch db
                            #js [(statement db
                                            "DELETE FROM discussion_push_devices WHERE platform = ? AND token = ? AND installation_id <> ?"
                                            platform token installation)
                                 (statement db
                                            (str "INSERT INTO discussion_push_devices "
                                                 "(installation_id, user_id, platform, token, updated_at, comments, reactions) "
                                                 "VALUES (?, ?, ?, ?, ?, COALESCE(?, 1), COALESCE(?, 1)) "
                                                 "ON CONFLICT(installation_id) DO UPDATE SET user_id = excluded.user_id, "
                                                 "platform = excluded.platform, token = excluded.token, updated_at = excluded.updated_at, "
                                                 "comments = COALESCE(?, discussion_push_devices.comments), "
                                                 "reactions = COALESCE(?, discussion_push_devices.reactions)")
                                            installation account platform token (common/now-ms)
                                            comment-flag reaction-flag comment-flag reaction-flag)])]
            (js/Response. nil #js {:status 204})))))))

(defn- class? [entity ident]
  (some #(= ident (:db/ident %)) (:block/tags entity)))

(defn- live? [entity]
  (and (:block/uuid entity) (not (entity-util/recycled? entity))))

(defn- author [entity]
  (some-> entity :logseq.property/created-by-ref :block/uuid str))

(defn- event-recipients [db-before entity]
  (if-let [target (:logseq.property.reaction/target entity)]
    (when (live? target) [(author target)])
    (let [thread (:block/parent entity)]
      (when (and (live? thread)
                 (class? thread :logseq.class/Comments)
                 (not (class? entity :logseq.class/Comments)))
        (let [targets (or (seq (:logseq.property.comments/blocks thread)) [(:block/parent thread)])
              previous-thread (d/entity db-before (:db/id thread))
              position (juxt :block/order #(str (:block/uuid %)))
              event-position (position entity)
              prior-comments (filter (fn [earlier]
                                       (and (not (class? earlier :logseq.class/Comments))
                                            (neg? (compare (position earlier) event-position))))
                                     (:block/_parent previous-thread))]
          (map author (filter live? (concat targets prior-comments))))))))

(defn- short-text [value limit]
  (when (string? value)
    (let [text (-> value
                   (string/replace #"[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]+" " ")
                   (string/replace #"\s+" " ")
                   string/trim)
          ;; The extra code point lets us detect truncation without splitting surrogate pairs.
          points (js/Array.from (subs text 0 (min (count text) (* 2 (inc limit)))))]
      (when (seq text)
        (if (> (.-length points) limit)
          (str (.join (.slice points 0 limit) "") "…")
          text)))))

(defn- display-name [value]
  (when (and (string? value) (not (string/includes? value "@")) (not (uuid-string? value)))
    (short-text value 64)))

(defn- avatar-url [value]
  (when (and (string? value) (<= (count value) 512) (string/starts-with? value "https://"))
    (try
      (let [url (js/URL. value)]
        (when (and (contains? #{"logseq-user-public-metadata-bucket-prod.s3.amazonaws.com" "assets.logseq.com" "assets.logseq.io" "avatars.githubusercontent.com" "lh3.googleusercontent.com"} (.-hostname url))
                   (every? string/blank? [(.-username url) (.-password url) (.-port url) (.-search url) (.-hash url)]))
          (.-href url)))
      (catch :default _ nil))))

(defn- reaction-glyph [value]
  (when (and (string? value) (re-matches #"[a-zA-Z0-9+_-]{1,80}" value))
    (some-> (gobj/get (gobj/get emoji-data "emojis") value)
            (gobj/get "skins")
            (aget 0)
            (gobj/get "native"))))

(defn event-routes [db-before db-after tx-data sender]
  (when (uuid-string? sender)
    (->> tx-data
         (keep (fn [{:keys [added a e]}]
                 (when (and added (= :block/uuid a)) e)))
         distinct
         (take 32)
         (keep (fn [eid]
                 (let [event (d/entity db-after eid)]
                   (when (and (not (:block/uuid (d/entity db-before eid)))
                              (live? event) (= sender (author event)))
                     (let [members (->> (event-recipients db-before event)
                                        (filter uuid-string?)
                                        (remove #{sender})
                                        distinct
                                        (take 12)
                                        vec)]
                       (when (seq members)
                         (let [reaction? (some? (:logseq.property.reaction/target event))
                               profile (:logseq.property/created-by-ref event)]
                           {:event (str (:block/uuid event))
                            :kind (if reaction? "reaction" "comment")
                            :recipients members
                            :sender-name (display-name (:logseq.property.user/name profile))
                            :avatar (avatar-url (:logseq.property.user/avatar profile))
                            :reaction (when reaction? (reaction-glyph (:logseq.property.reaction/emoji-id event)))
                            :comment-preview (when-not reaction? (short-text (:block/title event) 140))})))))))
         vec)))

(defn <queue-events! [env graph-id sender events]
  (let [now (common/now-ms)
        ^js db (aget env "DB")
        insert (str "INSERT OR IGNORE INTO discussion_push_outbox "
                    "(graph_id, event_id, recipient_id, sender_id, created_at, next_attempt_at, event_kind, sender_name, avatar_url, reaction_glyph, comment_preview) "
                    "SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN (SELECT graph_e2ee FROM graphs WHERE graph_id = ?) = 0 THEN ? END WHERE "
                    "EXISTS (SELECT 1 FROM graphs WHERE graph_id = ? AND user_id = ? "
                    "UNION SELECT 1 FROM graph_members WHERE graph_id = ? AND user_id = ?) "
                    "AND EXISTS (SELECT 1 FROM graphs WHERE graph_id = ? AND user_id = ? "
                    "UNION SELECT 1 FROM graph_members WHERE graph_id = ? AND user_id = ?) "
                    "AND EXISTS (SELECT 1 FROM discussion_push_devices WHERE user_id = ? "
                    "AND (CASE ? WHEN 'comment' THEN comments ELSE reactions END) = 1) "
                    "AND (SELECT count(*) FROM discussion_push_outbox WHERE sender_id = ? AND created_at > ?) < 60")
        writes (for [{:keys [event kind recipients sender-name avatar reaction comment-preview]} events
                     recipient recipients]
                 (statement db insert graph-id event recipient sender now now kind sender-name avatar reaction graph-id comment-preview
                            graph-id sender graph-id sender graph-id recipient graph-id recipient
                            recipient kind sender (- now 60000)))]
    (when (and db (send-enabled? env) (uuid-string? graph-id) (seq events))
      (.batch db (to-array (take 60 writes))))))

(defn enabled? [env]
  (and (aget env "DB") (send-enabled? env)))
