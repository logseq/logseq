(ns frontend.fs.sync
  "Main ns for providing file sync functionality"
  (:require ["@capawesome/capacitor-background-task" :refer [BackgroundTask]]
            ["path" :as node-path]
            [cljs-http.client :as http]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs.core.async :as async :refer [<! >! chan go go-loop offer!
                                               poll! timeout]]
            [cljs.core.async.impl.channels]
            [cljs.core.async.interop :refer [p->c]]
            [cljs.spec.alpha :as s]
            [clojure.pprint :as pp]
            [clojure.set :as set]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.debug :as debug]
            [frontend.diff :as diff]
            [frontend.encrypt :as encrypt]
            [frontend.fs :as fs]
            [frontend.fs.capacitor-fs :as capacitor-fs]
            [frontend.fs.diff-merge :as diff-merge]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user]
            [frontend.mobile.util :as mobile-util]
            [frontend.pubsub :as pubsub]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [frontend.util.persist-var :as persist-var]
            [goog.string :as gstring]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.graph-parser.util :as gp-util]
            [medley.core :refer [dedupe-by]]
            [promesa.core :as p]
            [rum.core :as rum]))

;;; ### Commentary
;; file-sync related local files/dirs:
;; - logseq/graphs-txid.edn
;;   this file contains [user-uuid graph-uuid transaction-id]
;;   graph-uuid: the unique identifier of the graph on the server
;;   transaction-id: sync progress of local files
;; - logseq/version-files
;;   downloaded version-files
;; files included by `get-ignored-files` will not be synchronized.
;;
;; sync strategy:
;; - when toggle file-sync on,
;;   trigger remote->local-full-sync first, then local->remote-full-sync
;;   local->remote-full-sync will compare local-files with remote-files (by md5),
;;   and upload new-added-files to remote server.
;; - if local->remote sync(normal-sync or full-sync) return :need-sync-remote,
;;   then trigger a remote->local sync
;; - if remote->local sync return :need-remote->local-full-sync,
;;   then we need a remote->local-full-sync,
;;   which compare local-files with remote-files, sync diff-remote-files to local
;; - local->remote-full-sync will be triggered after 20mins of idle
;; - every 10s, flush local changes, and sync to remote

;; TODO: use access-token instead of id-token
;; TODO: a remote delete-diff cause local related-file deleted, then trigger a `FileChangeEvent`,
;;       and re-produce a new same-file-delete diff.

;;; ### specs
(s/def ::state #{;; do following jobs when ::starting:
                 ;; - wait seconds for file-change-events from file-watcher
                 ;; - drop redundant file-change-events
                 ;; - setup states in `frontend.state`
                 ::starting
                 ::need-password
                 ::idle
                 ;; sync local-changed files
                 ::local->remote
                 ;; sync remote latest-transactions
                 ::remote->local
                 ;; local->remote full sync
                 ::local->remote-full-sync
                 ;; remote->local full sync
                 ::remote->local-full-sync
                 ;; snapshot state when switching between apps on iOS
                 ::pause
                 ::stop})
(s/def ::path string?)
(s/def ::time t/date?)
(s/def ::remote->local-type #{:delete :update
                              ;; :rename=:delete+:update
                              })
(s/def ::current-syncing-graph-uuid (s/or :nil nil? :graph-uuid string?))
(s/def ::recent-remote->local-file-item (s/keys :req-un [::remote->local-type ::checksum ::path]))
(s/def ::current-local->remote-files (s/coll-of ::path :kind set?))
(s/def ::current-remote->local-files (s/coll-of ::path :kind set?))
(s/def ::recent-remote->local-files (s/coll-of ::recent-remote->local-file-item :kind set?))
(s/def ::history-item (s/keys :req-un [::path ::time]))
(s/def ::history (s/coll-of ::history-item :kind seq?))
(s/def ::sync-state (s/keys :req-un [::current-syncing-graph-uuid
                                     ::state
                                     ::current-local->remote-files
                                     ::current-remote->local-files
                                     ::queued-local->remote-files
                                     ;; Downloading files from remote will trigger filewatcher events,
                                     ;; causes unreasonable information in the content of ::queued-local->remote-files,
                                     ;; use ::recent-remote->local-files to filter such events
                                     ::recent-remote->local-files
                                     ::history]))

;; diff
(s/def ::TXId pos-int?)
(s/def ::TXType #{"update_files" "delete_files" "rename_file"})
(s/def ::TXContent-to-path string?)
(s/def ::TXContent-from-path (s/or :some string? :none nil?))
(s/def ::TXContent-checksum (s/or :some string? :none nil?))
(s/def ::TXContent-item (s/tuple ::TXContent-to-path
                                 ::TXContent-from-path
                                 ::TXContent-checksum))
(s/def ::TXContent (s/coll-of ::TXContent-item))
(s/def ::diff (s/keys :req-un [::TXId ::TXType ::TXContent]))

(s/def ::succ-map #(= {:succ true} %))
(s/def ::unknown-map (comp some? :unknown))
(s/def ::stop-map #(= {:stop true} %))
(s/def ::pause-map #(= {:pause true} %))
(s/def ::need-sync-remote #(= {:need-sync-remote true} %))
(s/def ::graph-has-been-deleted #(= {:graph-has-been-deleted true} %))

(s/def ::sync-local->remote!-result
  (s/or :stop ::stop-map
        :succ ::succ-map
        :pause ::pause-map
        :need-sync-remote ::need-sync-remote
        :graph-has-been-deleted ::graph-has-been-deleted
        :unknown ::unknown-map))

(s/def ::sync-remote->local!-result
  (s/or :succ ::succ-map
        :need-remote->local-full-sync
        #(= {:need-remote->local-full-sync true} %)
        :stop ::stop-map
        :pause ::pause-map
        :unknown ::unknown-map))

(s/def ::sync-local->remote-all-files!-result
  (s/or :succ ::succ-map
        :stop ::stop-map
        :need-sync-remote ::need-sync-remote
        :graph-has-been-deleted ::graph-has-been-deleted
        :unknown ::unknown-map))

;; sync-event type
(s/def ::event #{:created-local-version-file
                 :finished-local->remote
                 :finished-remote->local
                 :start
                 :pause
                 :resume
                 :exception-decrypt-failed
                 :remote->local-full-sync-failed
                 :local->remote-full-sync-failed
                 :get-remote-graph-failed
                 :get-deletion-logs-failed
                 })

(s/def ::sync-event (s/keys :req-un [::event ::data]))

(defonce download-batch-size 100)
(defonce upload-batch-size 20)
(def ^:private current-sm-graph-uuid (atom nil))

;;; ### configs in config.edn
;; - :file-sync/ignore-files

(defn- get-ignored-files
  []
  (into #{#"logseq/graphs-txid.edn$"
          #"logseq/pages-metadata.edn$"
          #"logseq/version-files/"
          #"logseq/bak/"
          #"node_modules/"
          ;; path starts with `.` in the root directory, e.g. .gitignore
          #"^\.[^.]+"
          ;; path includes `/.`, e.g. .git, .DS_store
          #"/\."
          ;; Emacs/Vim backup files end with `~` by default
          #"~$"}
        (map re-pattern)
        (:file-sync/ignore-files (state/get-config))))

;;; ### configs ends

(def ws-addr config/WS-URL)

;; Warning: make sure to `persist-var/-load` graphs-txid before using it.
(defonce graphs-txid (persist-var/persist-var nil "graphs-txid"))

(declare assert-local-txid<=remote-txid)
(defn <update-graphs-txid!
  [latest-txid graph-uuid user-uuid repo]
  {:pre [(int? latest-txid) (>= latest-txid 0)]}
  (-> (p/let [_ (persist-var/-reset-value! graphs-txid [user-uuid graph-uuid latest-txid] repo)
              _ (persist-var/persist-save graphs-txid)]
        (when (state/developer-mode?) (assert-local-txid<=remote-txid)))
      p->c))

(defn clear-graphs-txid! [repo]
  (persist-var/-reset-value! graphs-txid nil repo)
  (persist-var/persist-save graphs-txid))

(defn- ws-ping-loop [ws]
  (go-loop []
    (let [state (.-readyState ws)]
      ;; not closing or closed state
      (when (not (contains? #{2 3} state))
        (if (not= 1 state)
          ;; when connecting, wait 1s
          (do (<! (timeout 1000))
              (recur))
          (do (.send ws "PING")
              ;; aws apigateway websocket
              ;; Idle Connection Timeout: 10min
              (<! (timeout (* 5 60 1000)))
              (recur)))))))

(defn- ws-stop! [*ws]
  (when *ws
    (swap! *ws (fn [o] (assoc o :stop true)))
    (when-let [ws (:ws @*ws)]
      (.close ws))))

(defn- ws-listen!*
  [graph-uuid *ws remote-changes-chan]
  (reset! *ws {:ws (js/WebSocket. (util/format ws-addr graph-uuid)) :stop false})
  (ws-ping-loop (:ws @*ws))
  ;; (set! (.-onopen (:ws @*ws)) #(println (util/format "ws opened: graph '%s'" graph-uuid %)))
  (set! (.-onclose (:ws @*ws)) (fn [_e]
                                 (when-not (true? (:stop @*ws))
                                   (go
                                     (timeout 1000)
                                     (println "re-connecting graph" graph-uuid)
                                     (ws-listen!* graph-uuid *ws remote-changes-chan)))))
  (set! (.-onmessage (:ws @*ws)) (fn [e]
                                   (let [data (js->clj (js/JSON.parse (.-data e)) :keywordize-keys true)]
                                     (when (some? (:txid data))
                                       (if-let [v (poll! remote-changes-chan)]
                                         (let [last-txid (:txid v)
                                               current-txid (:txid data)]
                                           (if (> last-txid current-txid)
                                             (offer! remote-changes-chan v)
                                             (offer! remote-changes-chan data)))
                                         (offer! remote-changes-chan data)))))))

(defn ws-listen!
  "return channel which output messages from server"
  [graph-uuid *ws]
  (let [remote-changes-chan (chan (async/sliding-buffer 1))]
    (ws-listen!* graph-uuid *ws remote-changes-chan)
    remote-changes-chan))

(defn- get-json-body [body]
  (or (and (not (string? body)) body)
      (or (string/blank? body) nil)
      (js->clj (js/JSON.parse body) :keywordize-keys true)))

(defn- get-resp-json-body [resp]
  (-> resp (:body) (get-json-body)))

(defn- <request-once [api-name body token]
  (go
    (let [resp (http/post (str "https://" config/API-DOMAIN "/file-sync/" api-name)
                          {:oauth-token token
                           :body (js/JSON.stringify (clj->js body))
                           :with-credentials? false})]
      {:resp (<! resp)
       :api-name api-name
       :body body})))

;; For debug
(def *on-flying-request
  "requests not finished"
  (atom #{}))

(def stoppable-apis #{"get_all_files"})

(defn- <request*
  "max retry count is 5.
  *stop: volatile var, stop retry-request when it's true,
          and return :stop"
  ([api-name body token *stop] (<request* api-name body token 0 *stop))
  ([api-name body token retry-count *stop]
   (go
     (if (and *stop @*stop (contains? stoppable-apis api-name))
       :stop
       (let [resp (<! (<request-once api-name body token))]
         (if (and
              (= 401 (get-in resp [:resp :status]))
              (= "Unauthorized" (:message (get-json-body (get-in resp [:resp :body])))))
           (if (> retry-count 5)
             (throw (js/Error. :file-sync-request))
             (do (println "will retry after" (min 60000 (* 1000 retry-count)) "ms")
                 (<! (timeout (min 60000 (* 1000 retry-count))))
                 (<! (<request* api-name body token (inc retry-count) *stop))))
           (:resp resp)))))))

(defn <request [api-name & args]
  (let [name (str api-name (.now js/Date))]
    (go (swap! *on-flying-request conj name)
      (let [r (<! (apply <request* api-name args))]
        (swap! *on-flying-request disj name)
        r))))

(defn- remove-dir-prefix [dir path]
  (let [r (string/replace path (js/RegExp. (str "^" (gstring/regExpEscape dir))) "")]
    (if (string/starts-with? r "/")
      (string/replace-first r "/" "")
      r)))

(defn- remove-user-graph-uuid-prefix
  "<user-uuid>/<graph-uuid>/path -> path"
  [path]
  (let [parts (string/split path "/")]
    (if (and (< 2 (count parts))
             (= 36 (count (parts 0)))
             (= 36 (count (parts 1))))
      (util/string-join-path (drop 2 parts))
      path)))

(defprotocol IRelativePath
  (-relative-path [this]))

(defn relative-path [o]
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))]
    (cond
      (implements? IRelativePath o)
      (-relative-path o)

      ;; full path
      (and (string? o) (string/starts-with? o repo-dir))
      (string/replace o (str repo-dir "/") "")

      (string? o)
      (remove-user-graph-uuid-prefix o)

      :else
      (throw (js/Error. (str "unsupported type " (str o)))))))

(defprotocol IChecksum
  (-checksum [this]))

(defprotocol IStoppable
  (-stop! [this]))
(defprotocol IStopped?
  (-stopped? [this]))
;from-path, to-path is relative path
(deftype FileTxn [from-path to-path updated? deleted? txid checksum]
  Object
  (renamed? [_]
    (not= from-path to-path))

  IRelativePath
  (-relative-path [_] (remove-user-graph-uuid-prefix to-path))

  IEquiv
  (-equiv [_ ^FileTxn other]
    (and (= from-path (.-from-path other))
         (= to-path (.-to-path other))
         (= updated? (.-updated? other))
         (= deleted? (.-deleted? other))))
  IHash
  (-hash [_] (hash [from-path to-path updated? deleted?]))

  IComparable
  (-compare [_ ^FileTxn other]
    (compare txid (.-txid other)))

  IPrintWithWriter
  (-pr-writer [coll w _opts]
    (write-all w "#FileTxn[\"" from-path "\" -> \"" to-path
               "\" (updated? " updated? ", renamed? " (.renamed? coll) ", deleted? " deleted?
               ", txid " txid ", checksum " checksum ")]")))

(defn- assert-filetxns
  [filetxns]
  (every? true?
          (mapv
           (fn [^FileTxn filetxn]
             (if (.-updated? filetxn)
               (some? (-checksum filetxn))
               true))
           filetxns)))

(defn- diff->filetxns
  "convert diff(`<get-diff`) to `FileTxn`"
  [{:keys [TXId TXType TXContent]}]
  {:post [(assert-filetxns %)]}
  (let [update? (= "update_files" TXType)
        delete? (= "delete_files" TXType)
        update-xf
                (comp
                 (remove #(or (empty? (first %))
                              (empty? (last %))))
                 (map #(->FileTxn (first %) (first %) update? delete? TXId (last %))))
        delete-xf
                (comp
                 (remove #(empty? (first %)))
                 (map #(->FileTxn (first %) (first %) update? delete? TXId nil)))
        rename-xf
                (comp
                 (remove #(or (empty? (first %))
                              (empty? (second %))))
                 (map #(->FileTxn (second %) (first %) false false TXId nil)))
        xf (case TXType
             "delete_files" delete-xf
             "update_files" update-xf
             "rename_file" rename-xf)]
    (sequence xf TXContent)))

(defn- distinct-update-filetxns-xf
  "transducer.
  remove duplicate update&delete `FileTxn`s."
  [rf]
  (let [seen-update&delete-filetxns (volatile! #{})]
    (fn
      ([] (rf))
      ([result] (rf result))
      ([result ^FileTxn filetxn]
       (if (and
            (or (.-updated? filetxn) (.-deleted? filetxn))
            (contains? @seen-update&delete-filetxns filetxn))
         result
         (do (vswap! seen-update&delete-filetxns conj filetxn)
             (rf result filetxn)))))))

(defn- remove-deleted-filetxns-xf
  "transducer.
  remove update&rename filetxns if they are deleted later(in greater txid filetxn)."
  [rf]
  (let [seen-deleted-paths (volatile! #{})]
    (fn
      ([] (rf))
      ([result] (rf result))
      ([result ^FileTxn filetxn]
       (let [to-path (.-to-path filetxn)
             from-path (.-from-path filetxn)]
         (if (contains? @seen-deleted-paths to-path)
           (do (when (not= to-path from-path)
                 (vswap! seen-deleted-paths disj to-path)
                 (vswap! seen-deleted-paths conj from-path))
               result)
           (do (vswap! seen-deleted-paths conj to-path)
               (rf result filetxn))))))))

(defn- partition-filetxns
  "return transducer.
  partition filetxns, at most N update-filetxns in each partition,
  for delete and rename type, only one filetxn in each partition."
  [n]
  (comp
   (partition-by #(.-updated? ^FileTxn %))
   (map (fn [ts]
          (if (some-> (first ts) (.-updated?))
            (partition-all n ts)
            (map list ts))))
   cat))

(defn- contains-path? [regexps path]
  (reduce #(when (re-find %2 path) (reduced true)) false regexps))

(defn ignored?
  "Whether file is ignored when syncing."
  [path]
  (->
   (get-ignored-files)
   (contains-path? (relative-path path))
   (boolean)))

(defn- filter-download-files-with-reserved-chars
  "Skip downloading file paths with reserved chars."
  [files]
  (let [f #(and
            (not (.-deleted? ^js %))
            (fs-util/include-reserved-chars? (-relative-path %)))
        reserved-files (filter f files)]
    (when (seq reserved-files)
      (state/pub-event! [:ui/notify-skipped-downloading-files
                         (map -relative-path reserved-files)])
      (prn "Skipped downloading those file paths with reserved chars: "
           (map -relative-path reserved-files)))
    (remove f files)))

(defn- filter-upload-files-with-reserved-chars
  "Remove upoading file paths with reserved chars."
  [paths]
  (let [path-string? (string? (first paths))
        f (if path-string?
            fs-util/include-reserved-chars?
            #(fs-util/include-reserved-chars? (-relative-path %)))
        reserved-paths (filter f paths)]
    (when (seq reserved-paths)
      (let [paths (if path-string? reserved-paths (map -relative-path reserved-paths))]
        (when (seq paths)
          (state/pub-event! [:ui/notify-outdated-filename-format paths]))
        (prn "Skipped uploading those file paths with reserved chars: " paths)))
    (vec (remove f paths))))

(defn- diffs->filetxns
  "transducer.
  1. diff -> `FileTxn` , see also `<get-diff`
  2. distinct redundant update type filetxns
  3. remove update or rename filetxns if they are deleted in later filetxns.
  NOTE: this xf should apply on reversed diffs sequence (sort by txid)"
  []
  (comp
   (map diff->filetxns)
   cat
   (remove ignored?)
   distinct-update-filetxns-xf
   remove-deleted-filetxns-xf))

(defn- diffs->partitioned-filetxns
  "partition filetxns, each partition contains same type filetxns,
   for update type, at most N items in each partition
   for delete & rename type, only 1 item in each partition."
  [n]
  (comp
   (diffs->filetxns)
   (partition-filetxns n)))

(defn- filepath+checksum->diff
  [index {:keys [relative-path checksum user-uuid graph-uuid]}]
  {:post [(s/valid? ::diff %)]}
  {:TXId (inc index)
   :TXType "update_files"
   :TXContent [[(util/string-join-path [user-uuid graph-uuid relative-path]) nil checksum]]})

(defn filepath+checksum-coll->partitioned-filetxns
  "transducer.
  1. filepath+checksum-coll -> diff
  2. diffs->partitioned-filetxns
  3. filter by config"
  [n graph-uuid user-uuid]
  (comp
   (map (fn [p]
          {:relative-path (first p) :user-uuid user-uuid :graph-uuid graph-uuid :checksum (second p)}))
   (map-indexed filepath+checksum->diff)
   (diffs->partitioned-filetxns n)))


(deftype FileMetadata [size etag path encrypted-path last-modified remote? txid ^:mutable normalized-path]
  Object
  (get-normalized-path [_]
    (assert (string? path) path)
    (when-not normalized-path
      (set! normalized-path
            (cond-> path
              (string/starts-with? path "/") (string/replace-first "/" "")
              remote? (remove-user-graph-uuid-prefix))))
    normalized-path)

  IRelativePath
  (-relative-path [_] path)

  IEquiv
  (-equiv [o ^FileMetadata other]
    (and (= (.get-normalized-path o) (.get-normalized-path other))
         (= etag (.-etag other))))

  IHash
  (-hash [_] (hash {:etag etag :path path}))

  ILookup
  (-lookup [o k] (-lookup o k nil))
  (-lookup [_ k not-found]
    (case k
      :size size
      :etag etag
      :path path
      :encrypted-path encrypted-path
      :last-modified last-modified
      :remote? remote?
      :txid txid
      not-found))


  IPrintWithWriter
  (-pr-writer [_ w _opts]
    (write-all w (str {:size size :etag etag :path path :remote? remote? :txid txid :last-modified last-modified}))))



(def ^:private higher-priority-remote-files
  "when diff all remote files and local files, following remote files always need to download(when checksum not matched),
  even local-file's last-modified > remote-file's last-modified.
  because these files will be auto created when the graph created, we dont want them to re-write related remote files."
  #{"pages/contents.md" "pages/contents.org"
    "logseq/metadata.edn"})

(def ^:private ignore-default-value-files
  "when create a new local graph, some files will be created (config.edn, custom.css).
  And related remote files wins if these files have default template value."
  #{"logseq/config.edn" "logseq/custom.css"})

(def ^:private empty-custom-css-md5 "d41d8cd98f00b204e9800998ecf8427e")

;; TODO: use fn some to filter FileMetadata here, it cause too much loop
(defn diff-file-metadata-sets
  "Find the `FileMetadata`s that exists in s1 and does not exist in s2,
  compare by path+checksum+last-modified,
  if s1.path = s2.path & s1.checksum <> s2.checksum
  (except some default created files),
  keep this `FileMetadata` in result"
  [s1 s2]
  (reduce
   (fn [result item]
     (let [path (:path item)
           lower-case-path (some-> path string/lower-case)
           ;; encrypted-path (:encrypted-path item)
           checksum (:etag item)
           last-modified (:last-modified item)]
       (if (some
            #(cond
               (not= lower-case-path (some-> (:path %) string/lower-case))
               false
               (= checksum (:etag %))
               true
               (>= last-modified (:last-modified %))
               false
               ;; these special files have higher priority in s1
               (contains? higher-priority-remote-files path)
               false
               ;; higher priority in s1 when config.edn=default value or empty custom.css
               (and (contains? ignore-default-value-files path)
                    (#{config/config-default-content-md5 empty-custom-css-md5} (:etag %)))
               false
               ;; special handling for css & edn files
               (and
                (or (string/ends-with? lower-case-path ".css")
                    (string/ends-with? lower-case-path ".edn"))
                (< last-modified (:last-modified %)))
               true)
            s2)
         result
         (conj result item))))
   #{} s1))

(comment
 (defn map->FileMetadata [m]
   (apply ->FileMetadata ((juxt :size :etag :path :encrypted-path :last-modified :remote? (constantly nil)) m)))

 (assert
  (=
   #{(map->FileMetadata {:size 1 :etag 2 :path 2 :encrypted-path 2 :last-modified 2})}
   (diff-file-metadata-sets
    (into #{}
          (map map->FileMetadata)
          [{:size 1 :etag 1 :path 1 :encrypted-path 1 :last-modified 1}
           {:size 1 :etag 2 :path 2 :encrypted-path 2 :last-modified 2}])
    (into #{}
          (map map->FileMetadata)
          [{:size 1 :etag 1 :path 1 :encrypted-path 1 :last-modified 1}
           {:size 1 :etag 1 :path 2 :encrypted-path 2 :last-modified 1}])))))

(extend-protocol IChecksum
  FileMetadata
  (-checksum [this] (.-etag this))
  FileTxn
  (-checksum [this] (.-checksum this)))

(defn- sort-file-metadata-fn
  ":recent-days-range > :favorite-pages > small-size pages > ...
  :recent-days-range : [<min-inst-ms> <max-inst-ms>]
"
  [& {:keys [recent-days-range favorite-pages]}]
  {:pre [(or (nil? recent-days-range)
             (every? number? recent-days-range))]}
  (let [favorite-pages* (set favorite-pages)]
    (fn [^FileMetadata item]
      (let [path (relative-path item)
            journal-dir (node-path/join (config/get-journals-directory) node-path/sep)
            journal? (string/starts-with? path journal-dir)
            journal-day
            (when journal?
              (try
                (tc/to-long
                 (tf/parse (tf/formatter "yyyy_MM_dd")
                           (-> path
                               (string/replace-first journal-dir "")
                               (string/replace-first ".md" ""))))
                (catch :default _)))]
        (cond
          (and recent-days-range
               journal-day
               (<= (first recent-days-range)
                   ^number journal-day
                   (second recent-days-range)))
          journal-day

          (string/includes? path "logseq/")
          9999

          (string/includes? path "content.")
          10000

          (contains? favorite-pages* path)
          (count path)

          :else
          (- (.-size item)))))))
;;; ### path-normalize
(def path-normalize

  gp-util/path-normalize)


;;; ### APIs
;; `RSAPI` call apis through rsapi package, supports operations on files

(defprotocol IRSAPI
  (rsapi-ready? [this graph-uuid] "return true when rsapi ready")
  (<key-gen [this] "generate public+private keys")
  (<set-env [this graph-uuid prod? private-key public-key] "set environment")
  (<get-local-files-meta [this graph-uuid base-path filepaths] "get local files' metadata")
  (<get-local-all-files-meta [this graph-uuid base-path] "get all local files' metadata")
  (<rename-local-file [this graph-uuid base-path from to])
  (<update-local-files [this graph-uuid base-path filepaths] "remote -> local")
  (<fetch-remote-files [this graph-uuid base-path filepaths] "remote -> local version-db")
  (<download-version-files [this graph-uuid base-path filepaths])
  (<delete-local-files [this graph-uuid base-path filepaths])
  (<update-remote-files [this graph-uuid base-path filepaths local-txid] "local -> remote, return err or txid")
  (<delete-remote-files [this graph-uuid base-path filepaths local-txid] "return err or txid")
  (<encrypt-fnames [this graph-uuid fnames])
  (<decrypt-fnames [this graph-uuid fnames])
  (<cancel-all-requests [this])
  (<add-new-version [this repo path content]))

(defprotocol IRemoteAPI
  (<user-info [this] "user info")
  (<get-remote-all-files-meta [this graph-uuid] "get all remote files' metadata")
  (<get-remote-files-meta [this graph-uuid filepaths] "get remote files' metadata")
  (<get-remote-graph [this graph-name-opt graph-uuid-opt] "get graph info by GRAPH-NAME-OPT or GRAPH-UUID-OPT")
  (<get-remote-txid [this graph-uuid] "get remote graph's txid")
  (<get-remote-file-versions [this graph-uuid filepath] "get file's version list")
  (<list-remote-graphs [this] "list all remote graphs")
  (<get-deletion-logs [this graph-uuid from-txid] "get deletion logs from FROM-TXID")
  (<get-diff [this graph-uuid from-txid] "get diff from FROM-TXID, return [txns, latest-txid, min-txid]")
  (<create-graph [this graph-name] "create graph")
  (<delete-graph [this graph-uuid] "delete graph")
  (<get-graph-salt [this graph-uuid] "return httpcode 410 when salt expired")
  (<create-graph-salt [this graph-uuid] "return httpcode 409 when salt already exists and not expired yet")
  (<get-graph-encrypt-keys [this graph-uuid])
  (<upload-graph-encrypt-keys [this graph-uuid public-key encrypted-private-key]))


(defprotocol IRemoteControlAPI
  "api functions provided for outside the sync process"
  (<delete-remote-files-control [this graph-uuid filepaths])
  )

(defprotocol IToken
  (<get-token [this]))


(defn <case-different-local-file-exist?
  "e.g. filepath=\"pages/Foo.md\"
  found-filepath=\"pages/foo.md\"
  it happens on macos (case-insensitive fs)

  return canonicalized filepath if exists"
  [graph-uuid irsapi base-path filepath]
  (go
    (let [r (<! (<get-local-files-meta irsapi graph-uuid base-path [filepath]))]
      (when (some-> r first :path (not= filepath))
        (-> r first :path)))))

(defn <local-file-not-exist?
  [graph-uuid irsapi base-path filepath]
  (go
    (let [r (<! (<get-local-files-meta irsapi graph-uuid base-path [filepath]))]

      (or
       ;; not found at all
       (empty? r)
       ;; or,
       ;; e.g. filepath="pages/Foo.md"
       ;; found-filepath="pages/foo.md"
       ;; it happens on macos (case-insensitive fs)
       (not= filepath (:path (first r)))))))

(defn- <retry-rsapi [f]
  (go-loop [n 3]
    (let [r (<! (f))]
      (when (instance? ExceptionInfo r)
        (js/console.error "rsapi error:" (str (ex-cause r))))
      (if (and (instance? ExceptionInfo r)
               (string/index-of (str (ex-cause r)) "operation timed out")
               (> n 0))
        (do
          (print (str "retry(" n ") ..."))
          (recur (dec n)))
        r))))

(declare <rsapi-cancel-all-requests)

(defn- <build-local-file-metadatas
  [this graph-uuid r]
  (go-loop [[[path metadata] & others] (js->clj r)
            result #{}]
    (if-not (and path metadata)
      ;; finish
      result
      (let [normalized-path (path-normalize path)
            encryptedFname  (if (not= path normalized-path)
                              (first (<! (<encrypt-fnames this graph-uuid [normalized-path])))
                              (get metadata "encryptedFname"))]
        (recur others
               (conj result
                     (->FileMetadata (get metadata "size") (get metadata "md5") normalized-path
                                     encryptedFname (get metadata "mtime") false nil nil)))))))

(deftype RSAPI [^:mutable graph-uuid' ^:mutable private-key' ^:mutable public-key']
  IToken
  (<get-token [_this]
    (user/<wrap-ensure-id&access-token
     (state/get-auth-id-token)))

  IRSAPI
  (rsapi-ready? [_ graph-uuid] (and (= graph-uuid graph-uuid') private-key' public-key'))
  (<key-gen [_] (go (js->clj (<! (p->c (ipc/ipc "key-gen")))
                             :keywordize-keys true)))
  (<set-env [_ graph-uuid prod? private-key public-key]
    (when (not-empty private-key)
      (print (util/format "[%s] setting sync age-encryption passphrase..." graph-uuid)))
    (set! graph-uuid' graph-uuid)
    (set! private-key' private-key)
    (set! public-key' public-key)
    (p->c (ipc/ipc "set-env" graph-uuid (if prod? "prod" "dev") private-key public-key)))
  (<get-local-all-files-meta [this graph-uuid base-path]
    (go
      (let [r (<! (<retry-rsapi #(p->c (ipc/ipc "get-local-all-files-meta" graph-uuid base-path))))]
        (if (instance? ExceptionInfo r)
          r
          (<! (<build-local-file-metadatas this graph-uuid r))))))
  (<get-local-files-meta [this graph-uuid base-path filepaths]
    (go
      (let [r (<! (<retry-rsapi #(p->c (ipc/ipc "get-local-files-meta" graph-uuid base-path filepaths))))]
        (assert (not (instance? ExceptionInfo r)) "get-local-files-meta shouldn't return exception")
        (<! (<build-local-file-metadatas this graph-uuid r)))))
  (<rename-local-file [_ graph-uuid base-path from to]
    (<retry-rsapi #(p->c (ipc/ipc "rename-local-file" graph-uuid base-path
                                  (path-normalize from)
                                  (path-normalize to)))))
  (<update-local-files [this graph-uuid base-path filepaths]
    (println "update-local-files" graph-uuid base-path filepaths)
    (go
      (<! (<rsapi-cancel-all-requests))
      (let [token (<! (<get-token this))]
        (<! (p->c (ipc/ipc "update-local-files" graph-uuid base-path filepaths token))))))
  (<fetch-remote-files [this graph-uuid base-path filepaths]
    (go
      (<! (<rsapi-cancel-all-requests))
      (let [token (<! (<get-token this))]
        (<! (p->c (ipc/ipc "fetch-remote-files" graph-uuid base-path filepaths token))))))

  (<download-version-files [this graph-uuid base-path filepaths]
    (go
      (let [token (<! (<get-token this))
            r (<! (<retry-rsapi
                   #(p->c (ipc/ipc "download-version-files" graph-uuid base-path filepaths token))))]
        r)))

  (<delete-local-files [_ graph-uuid base-path filepaths]
    (let [normalized-filepaths (mapv path-normalize filepaths)]
      (go
        (println "delete-local-files" filepaths)
        (let [r (<! (<retry-rsapi #(p->c (ipc/ipc "delete-local-files" graph-uuid base-path normalized-filepaths))))]
          r))))

  (<update-remote-files [this graph-uuid base-path filepaths local-txid]
    (let [normalized-filepaths (mapv path-normalize filepaths)]
      (go
        (<! (<rsapi-cancel-all-requests))
        (let [token (<! (<get-token this))]
          (<! (<retry-rsapi
               #(p->c (ipc/ipc "update-remote-files" graph-uuid base-path normalized-filepaths local-txid token))))))))

  (<delete-remote-files [this graph-uuid base-path filepaths local-txid]
    (let [normalized-filepaths (mapv path-normalize filepaths)]
      (go
        (let [token (<! (<get-token this))]
          (<!
           (<retry-rsapi
            #(p->c (ipc/ipc "delete-remote-files" graph-uuid base-path normalized-filepaths local-txid token))))))))
  (<encrypt-fnames [_ graph-uuid fnames] (go (js->clj (<! (p->c (ipc/ipc "encrypt-fnames" graph-uuid fnames))))))
  (<decrypt-fnames [_ graph-uuid fnames] (go
                                           (let [r (<! (p->c (ipc/ipc "decrypt-fnames" graph-uuid fnames)))]
                                             (if (instance? ExceptionInfo r)
                                               (ex-info "decrypt-failed" {:fnames fnames} (ex-cause r))
                                               (js->clj r)))))
  (<cancel-all-requests [_]
    (p->c (ipc/ipc "cancel-all-requests")))

  (<add-new-version [_this repo path content]
    (p->c (ipc/ipc "addVersionFile" (config/get-local-dir repo) path content))))

(deftype ^:large-vars/cleanup-todo CapacitorAPI [^:mutable graph-uuid' ^:mutable private-key ^:mutable public-key']
  IToken
  (<get-token [_this]
    (user/<wrap-ensure-id&access-token
     (state/get-auth-id-token)))

  IRSAPI
  (rsapi-ready? [_ graph-uuid] (and (= graph-uuid graph-uuid') private-key public-key'))
  (<key-gen [_]
    (go (let [r (<! (p->c (.keygen mobile-util/file-sync #js {})))]
          (-> r
              (js->clj :keywordize-keys true)))))
  (<set-env [_ graph-uuid prod? secret-key public-key]
    (set! graph-uuid' graph-uuid)
    (set! private-key secret-key)
    (set! public-key' public-key)
    (p->c (.setEnv mobile-util/file-sync (clj->js {:graphUUID graph-uuid
                                                   :env (if prod? "prod" "dev")
                                                   :secretKey secret-key
                                                   :publicKey public-key}))))

  (<get-local-all-files-meta [this graph-uuid base-path]
    (go
      (let [r (<! (p->c (.getLocalAllFilesMeta mobile-util/file-sync (clj->js {:graphUUID graph-uuid
                                                                               :basePath base-path}))))]
        (if (instance? ExceptionInfo r)
          r
          (<! (<build-local-file-metadatas this graph-uuid (.-result r)))))))

  (<get-local-files-meta [this graph-uuid base-path filepaths]
    (go
      (let [r (<! (p->c (.getLocalFilesMeta mobile-util/file-sync
                                            (clj->js {:graphUUID graph-uuid
                                                      :basePath base-path
                                                      :filePaths filepaths}))))]
        (assert (not (instance? ExceptionInfo r)) "get-local-files-meta shouldn't return exception")
        (<! (<build-local-file-metadatas this graph-uuid (.-result r))))))

  (<rename-local-file [_ graph-uuid base-path from to]
    (p->c (.renameLocalFile mobile-util/file-sync
                            (clj->js {:graphUUID graph-uuid
                                      :basePath base-path
                                      :from (path-normalize from)
                                      :to (path-normalize to)}))))

  (<update-local-files [this graph-uuid base-path filepaths]
    (go
      (let [token (<! (<get-token this))
            filepaths' (map path-normalize filepaths)]
        (<! (p->c (.updateLocalFiles mobile-util/file-sync (clj->js {:graphUUID graph-uuid
                                                                     :basePath base-path
                                                                     :filePaths filepaths'
                                                                     :token token})))))))
  (<fetch-remote-files [this graph-uuid base-path filepaths]
    (go
      (let [token (<! (<get-token this))
            r (<! (<retry-rsapi
                   #(p->c (.fetchRemoteFiles mobile-util/file-sync
                                             (clj->js {:graphUUID graph-uuid
                                                       :basePath base-path
                                                       :filePaths filepaths
                                                       :token token})))))]
        (js->clj (.-value r)))))
  (<download-version-files [this graph-uuid base-path filepaths]
    (go
      (let [token (<! (<get-token this))
            r (<! (<retry-rsapi
                   #(p->c (.updateLocalVersionFiles mobile-util/file-sync
                                                    (clj->js {:graphUUID graph-uuid
                                                              :basePath base-path
                                                              :filePaths filepaths
                                                              :token token})))))]
        r)))

  (<delete-local-files [_ graph-uuid base-path filepaths]
    (let [normalized-filepaths (mapv path-normalize filepaths)]
      (go
        (let [r (<! (<retry-rsapi #(p->c (.deleteLocalFiles mobile-util/file-sync
                                                            (clj->js {:graphUUID graph-uuid
                                                                      :basePath base-path
                                                                      :filePaths normalized-filepaths})))))]
          r))))

  (<update-remote-files [this graph-uuid base-path filepaths local-txid]
    (let [normalized-filepaths (mapv path-normalize filepaths)]
      (go
        (let [token (<! (<get-token this))
              r (<! (p->c (.updateRemoteFiles mobile-util/file-sync
                                              (clj->js {:graphUUID graph-uuid
                                                        :basePath base-path
                                                        :filePaths normalized-filepaths
                                                        :txid local-txid
                                                        :token token
                                                        :fnameEncryption true}))))]
          (if (instance? ExceptionInfo r)
            r
            (get (js->clj r) "txid"))))))

  (<delete-remote-files [this graph-uuid base-path filepaths local-txid]
    (let [normalized-filepaths (mapv path-normalize filepaths)]
      (go
        (let [token (<! (<get-token this))
              r (<! (p->c (.deleteRemoteFiles mobile-util/file-sync
                                              (clj->js {:graphUUID graph-uuid
                                                        :basePath base-path
                                                        :filePaths normalized-filepaths
                                                        :txid local-txid
                                                        :token token}))))]
          (if (instance? ExceptionInfo r)
            r
            (get (js->clj r) "txid"))))))

  (<encrypt-fnames [_ graph-uuid fnames]
    (go
      (let [r (<! (p->c (.encryptFnames mobile-util/file-sync
                                        (clj->js {:graphUUID graph-uuid
                                                  :filePaths fnames}))))]
        (if (instance? ExceptionInfo r)
          (.-cause r)
          (get (js->clj r) "value")))))
  (<decrypt-fnames [_ graph-uuid fnames]
    (go (let [r (<! (p->c (.decryptFnames mobile-util/file-sync
                                          (clj->js {:graphUUID graph-uuid
                                                    :filePaths fnames}))))]
          (if (instance? ExceptionInfo r)
            (ex-info "decrypt-failed" {:fnames fnames} (ex-cause r))
            (get (js->clj r) "value")))))
  (<cancel-all-requests [_]
    (p->c (.cancelAllRequests mobile-util/file-sync)))
  (<add-new-version [_this repo path content]
    (p->c (capacitor-fs/backup-file repo :version-file-dir path content))))

(def rsapi (cond
             (util/electron?)
             (->RSAPI nil nil nil)

             (mobile-util/native-ios?)
             (->CapacitorAPI nil nil nil)

             (mobile-util/native-android?)
             (->CapacitorAPI nil nil nil)

             :else
             nil))

(defn add-new-version-file
  [repo path content]
  (<add-new-version rsapi repo path content))

(defn <rsapi-cancel-all-requests []
  (go
    (when rsapi
      (<! (<cancel-all-requests rsapi)))))

;;; ### remote & rs api exceptions
(defn sync-stop-when-api-flying?
  [exp]
  (some-> (ex-data exp) :err (= :stop)))

(defn storage-exceed-limit?
  [exp]
  (some->> (ex-data exp)
           :err
           ((juxt :status (comp :message :body)))
           ((fn [[status msg]] (and (= 403 status) (= msg "storage-limit"))))))

(defn graph-count-exceed-limit?
  [exp]
  (some->> (ex-data exp)
           :err
           ((juxt :status (comp :message :body)))
           ((fn [[status msg]] (and (= 403 status) (= msg "graph-count-exceed-limit"))))))

(defn decrypt-exp?
  [exp]
  (some-> exp ex-message #(= % "decrypt-failed")))

;;; remote api exceptions ends

;;; ### sync events

(defn- put-sync-event!
  [val]
  (async/put! pubsub/sync-events-ch val))

(def ^:private debug-print-sync-events-loop-stop-chan (chan 1))
(defn debug-print-sync-events-loop
  ([] (debug-print-sync-events-loop [:created-local-version-file
                                     :finished-local->remote
                                     :finished-remote->local
                                     :pause
                                     :resume
                                     :exception-decrypt-failed
                                     :remote->local-full-sync-failed
                                     :local->remote-full-sync-failed]))
  ([topics]
   (util/drain-chan debug-print-sync-events-loop-stop-chan)
   (let [topic&chs (map (juxt identity #(chan 10)) topics)
         out-ch (chan 10)
         out-mix (async/mix out-ch)]
     (doseq [[topic ch] topic&chs]
       (async/sub pubsub/sync-events-pub topic ch)
       (async/admix out-mix ch))
     (go-loop []
       (let [{:keys [val stop]}
             (async/alt!
              debug-print-sync-events-loop-stop-chan {:stop true}
              out-ch ([v] {:val v}))]
         (cond
           stop (do (async/unmix-all out-mix)
                    (doseq [[topic ch] topic&chs]
                      (async/unsub pubsub/sync-events-pub topic ch)))

           val (do (pp/pprint [:debug :sync-event val])
                   (recur))))))))


(defn stop-debug-print-sync-events-loop
  []
  (offer! debug-print-sync-events-loop-stop-chan true))


;;; sync events ends

(defn- fire-file-sync-storage-exceed-limit-event!
  [exp]
  (when (storage-exceed-limit? exp)
    (state/pub-event! [:file-sync/storage-exceed-limit])
    true))

(defn- fire-file-sync-graph-count-exceed-limit-event!
  [exp]
  (when (graph-count-exceed-limit? exp)
    (state/pub-event! [:file-sync/graph-count-exceed-limit])
    true))

(deftype RemoteAPI [*stopped?]
  Object

  (<request [this api-name body]
    (go
      (let [resp (<! (<request api-name body (<! (<get-token this)) *stopped?))]
        (if (http/unexceptional-status? (:status resp))
          (get-resp-json-body resp)
          (let [exp (ex-info "request failed"
                             {:err          resp
                              :body         (:body resp)
                              :api-name     api-name
                              :request-body body})]
            (fire-file-sync-storage-exceed-limit-event! exp)
            (fire-file-sync-graph-count-exceed-limit-event! exp)
            exp)))))

  ;; for test
  (update-files [this graph-uuid txid files]
    {:pre [(map? files)
           (number? txid)]}
    (.<request this "update_files" {:GraphUUID graph-uuid :TXId txid :Files files}))

  IToken
  (<get-token [_this]
    (user/<wrap-ensure-id&access-token
     (state/get-auth-id-token))))

(defn- filter-files-with-unnormalized-path
  [file-meta-list encrypted-path->path-map]
  (let [path->encrypted-path-map (set/map-invert encrypted-path->path-map)
        raw-paths (vals encrypted-path->path-map)
        *encrypted-paths-to-drop (transient [])]
    (loop [[raw-path & other-paths] raw-paths]
      (when raw-path
        (let [normalized-path (path-normalize raw-path)]
          (when (not= normalized-path raw-path)
            (println :filter-files-with-unnormalized-path raw-path)
            (conj! *encrypted-paths-to-drop (get path->encrypted-path-map raw-path))))
        (recur other-paths)))
    (let [encrypted-paths-to-drop (set (persistent! *encrypted-paths-to-drop))]
      (filterv #(not (contains? encrypted-paths-to-drop (:encrypted-path %))) file-meta-list))))

(defn- filter-case-different-same-files
  "filter case-different-but-same-name files, last-modified one wins"
  [file-meta-list encrypted-path->path-map]
  (let [seen (volatile! {})]
    (loop [result-file-meta-list (transient {})
           [f & others] file-meta-list]
      (if f
        (let [origin-path (get encrypted-path->path-map (:encrypted-path f))
              _ (assert (some? origin-path) f)
              path (string/lower-case origin-path)
              last-modified (:last-modified f)
              last-modified-seen (get @seen path)]
          (cond
            (or (and path (nil? last-modified-seen))
                (and path (some? last-modified-seen) (> last-modified last-modified-seen)))
            ;; 1. not found in seen
            ;; 2. found in seen, but current f wins
            (do (vswap! seen conj [path last-modified])
                (recur (conj! result-file-meta-list [path f]) others))

            (and path (some? last-modified-seen) (<= last-modified last-modified-seen))
            ;; found in seen, and seen-f has more recent last-modified epoch
            (recur result-file-meta-list others)

            :else
            (do (println :debug-filter-case-different-same-files:unreachable f path)
                (recur result-file-meta-list others))))
        (vals (persistent! result-file-meta-list))))))


(extend-type RemoteAPI
  IRemoteAPI
  (<user-info [this]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "user_info" {}))))
  (<get-remote-all-files-meta [this graph-uuid]
    (user/<wrap-ensure-id&access-token
     (let [file-meta-list      (transient #{})
           encrypted-path-list (transient [])
           exp-r
           (<!
            (go-loop [continuation-token nil]
              (let [r (<! (.<request this "get_all_files"
                                     (into
                                      {}
                                      (remove (comp nil? second)
                                              {:GraphUUID graph-uuid :ContinuationToken continuation-token}))))]
                (if (instance? ExceptionInfo r)
                  r
                  (let [next-continuation-token (:NextContinuationToken r)
                        objs                    (:Objects r)]
                    (apply conj! encrypted-path-list (map (comp remove-user-graph-uuid-prefix :Key) objs))
                    (apply conj! file-meta-list
                           (map
                            #(hash-map :checksum (:checksum %)
                                       :encrypted-path (remove-user-graph-uuid-prefix (:Key %))
                                       :size (:Size %)
                                       :last-modified (:LastModified %)
                                       :txid (:Txid %))
                            objs))
                    (when-not (empty? next-continuation-token)
                      (recur next-continuation-token)))))))]
       (if (instance? ExceptionInfo exp-r)
         exp-r
         (let [file-meta-list*      (persistent! file-meta-list)
               encrypted-path-list* (persistent! encrypted-path-list)
               path-list-or-exp     (<! (<decrypt-fnames rsapi graph-uuid encrypted-path-list*))]
           (if (instance? ExceptionInfo path-list-or-exp)
             path-list-or-exp
             (let [encrypted-path->path-map (zipmap encrypted-path-list* path-list-or-exp)]
               (set
                (mapv
                 #(->FileMetadata (:size %)
                                  (:checksum %)
                                  (get encrypted-path->path-map (:encrypted-path %))
                                  (:encrypted-path %)
                                  (:last-modified %)
                                  true
                                  (:txid %)
                                  nil)
                 (-> file-meta-list*
                     (filter-files-with-unnormalized-path encrypted-path->path-map)
                     (filter-case-different-same-files encrypted-path->path-map)))))))))))

  (<get-remote-files-meta [this graph-uuid filepaths]
    {:pre [(coll? filepaths)]}
    (user/<wrap-ensure-id&access-token
     (let [encrypted-paths* (<! (<encrypt-fnames rsapi graph-uuid filepaths))
           r                (<! (.<request this "get_files_meta" {:GraphUUID graph-uuid :Files encrypted-paths*}))]
       (if (instance? ExceptionInfo r)
         r
         (let [encrypted-paths (mapv :FilePath r)
               paths-or-exp    (<! (<decrypt-fnames rsapi graph-uuid encrypted-paths))]
           (if (instance? ExceptionInfo paths-or-exp)
             paths-or-exp
             (let [encrypted-path->path-map (zipmap encrypted-paths paths-or-exp)]
               (into #{}
                     (comp
                      (filter #(not= "filepath too long" (:Error %)))
                      (map #(->FileMetadata (:Size %)
                                            (:Checksum %)
                                            (some->> (get encrypted-path->path-map (:FilePath %))
                                                     path-normalize)
                                            (:FilePath %)
                                            (:LastModified %)
                                            true
                                            (:Txid %)
                                            nil)))
                     r))))))))

  (<get-remote-graph [this graph-name-opt graph-uuid-opt]
    {:pre [(or graph-name-opt graph-uuid-opt)]}
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "get_graph" (cond-> {}
                                       (seq graph-name-opt)
                                       (assoc :GraphName graph-name-opt)
                                       (seq graph-uuid-opt)
                                       (assoc :GraphUUID graph-uuid-opt))))))

  (<get-remote-txid [this graph-uuid]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "get_txid" {:GraphUUID graph-uuid}))))

  (<get-remote-file-versions [this graph-uuid filepath]
    (user/<wrap-ensure-id&access-token
     (let [encrypted-path (first (<! (<encrypt-fnames rsapi graph-uuid [filepath])))]
       (<! (.<request this "get_file_version_list" {:GraphUUID graph-uuid :File encrypted-path})))))

  (<list-remote-graphs [this]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "list_graphs"))))

  (<get-deletion-logs [this graph-uuid from-txid]
    (user/<wrap-ensure-id&access-token
     (let [r (<! (.<request this "get_deletion_log_v20221212" {:GraphUUID graph-uuid :FromTXId from-txid}))]
       (if (instance? ExceptionInfo r)
         r
         (let [txns-with-encrypted-paths (mapv (fn [txn]
                                                 (assoc txn :paths
                                                        (mapv remove-user-graph-uuid-prefix (:paths txn))))
                                               (:Transactions r))
               encrypted-paths           (mapcat :paths txns-with-encrypted-paths)
               encrypted-path->path-map
               (zipmap
                encrypted-paths
                (<! (<decrypt-fnames rsapi graph-uuid encrypted-paths)))
               txns
               (mapv
                (fn [txn]
                  (assoc txn :paths (mapv #(get encrypted-path->path-map %) (:paths txn))))
                txns-with-encrypted-paths)]
           txns)))))

  (<get-diff [this graph-uuid from-txid]
    ;; TODO: path in transactions should be relative path(now s3 key, which includes graph-uuid and user-uuid)
    (user/<wrap-ensure-id&access-token
     (let [r (<! (.<request this "get_diff" {:GraphUUID graph-uuid :FromTXId from-txid}))]
       (if (instance? ExceptionInfo r)
         r
         (let [txns-with-encrypted-paths (sort-by :TXId (:Transactions r))
               txns-with-encrypted-paths*
               (mapv
                (fn [txn]
                  (assoc txn :TXContent
                         (mapv
                          (fn [[to-path from-path checksum]]
                            [(remove-user-graph-uuid-prefix to-path)
                             (some-> from-path remove-user-graph-uuid-prefix)
                             checksum])
                          (:TXContent txn))))
                txns-with-encrypted-paths)
               encrypted-paths
               (mapcat
                (fn [txn]
                  (remove
                   #(or (nil? %) (not (string/starts-with? % "e.")))
                   (mapcat
                    (fn [[to-path from-path _checksum]] [to-path from-path])
                    (:TXContent txn))))
                txns-with-encrypted-paths*)
               encrypted-path->path-map
               (zipmap
                encrypted-paths
                (<! (<decrypt-fnames rsapi graph-uuid encrypted-paths)))
               txns
               (mapv
                (fn [txn]
                  (assoc
                   txn :TXContent
                   (mapv
                    (fn [[to-path from-path checksum]]
                      [(get encrypted-path->path-map to-path to-path)
                       (some->> from-path (get encrypted-path->path-map))
                       checksum])
                    (:TXContent txn))))
                txns-with-encrypted-paths*)]
           [txns
            (:TXId (last txns))
            (:TXId (first txns))])))))

  (<create-graph [this graph-name]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "create_graph" {:GraphName graph-name}))))

  (<delete-graph [this graph-uuid]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "delete_graph" {:GraphUUID graph-uuid}))))

  (<get-graph-salt [this graph-uuid]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "get_graph_salt" {:GraphUUID graph-uuid}))))

  (<create-graph-salt [this graph-uuid]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "create_graph_salt" {:GraphUUID graph-uuid}))))

  (<get-graph-encrypt-keys [this graph-uuid]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "get_graph_encrypt_keys" {:GraphUUID graph-uuid}))))

  (<upload-graph-encrypt-keys [this graph-uuid public-key encrypted-private-key]
    (user/<wrap-ensure-id&access-token
     (<! (.<request this "upload_graph_encrypt_keys" {:GraphUUID             graph-uuid
                                                      :public-key            public-key
                                                      :encrypted-private-key encrypted-private-key})))))

(extend-type RemoteAPI
  IRemoteControlAPI
  (<delete-remote-files-control [this graph-uuid filepaths]
    (user/<wrap-ensure-id&access-token
     (let [partitioned-files (partition-all 20 (<! (<encrypt-fnames rsapi graph-uuid filepaths)))]
       (loop [[files & others] partitioned-files]
         (when files
           (let [current-txid (:TXId (<! (<get-remote-txid this graph-uuid)))]
             (<! (.<request this "delete_files" {:GraphUUID graph-uuid :TXId current-txid :Files files}))
             (recur others))))))))

(comment
  (declare remoteapi)
  (<delete-remote-files-control remoteapi (second @graphs-txid) ["pages/aa.md"])

  )

(def remoteapi (->RemoteAPI nil))


(def ^:private *get-graph-salt-memoize-cache (atom {}))
(defn update-graph-salt-cache [graph-uuid v]
  {:pre [(map? v)
         (= #{:value :expired-at} (set (keys v)))]}
  (swap! *get-graph-salt-memoize-cache conj [graph-uuid v]))

(defn <get-graph-salt-memoize [remoteapi graph-uuid]
  (go
    (let [r          (get @*get-graph-salt-memoize-cache graph-uuid)
          expired-at (:expired-at r)
          now        (tc/to-long (t/now))]
      (if (< now expired-at)
        r
        (let [r (<! (<get-graph-salt remoteapi graph-uuid))]
          (swap! *get-graph-salt-memoize-cache conj [graph-uuid r])
          r)))))

(def ^:private *get-graph-encrypt-keys-memoize-cache (atom {}))
(defn update-graph-encrypt-keys-cache [graph-uuid v]
  {:pre [(map? v)
         (= #{:public-key :encrypted-private-key} (set (keys v)))]}
  (swap! *get-graph-encrypt-keys-memoize-cache conj [graph-uuid v]))

(defn <get-graph-encrypt-keys-memoize [remoteapi graph-uuid]
  (go
    (or (get @*get-graph-encrypt-keys-memoize-cache graph-uuid)
        (let [{:keys [public-key encrypted-private-key] :as r}
              (<! (<get-graph-encrypt-keys remoteapi graph-uuid))]
          (when (and public-key encrypted-private-key)
            (swap! *get-graph-encrypt-keys-memoize-cache conj [graph-uuid r]))
          r))))

(defn- is-journals-or-pages?
  [filetxn]
  (let [rel-path (relative-path filetxn)]
    (or (string/starts-with? rel-path (node-path/join (config/get-journals-directory) node-path/sep))
        (string/starts-with? rel-path (node-path/join (config/get-pages-directory) node-path/sep)))))

(defn- need-add-version-file?
  "when we need to create a new version file:
  1. when apply a 'update' filetxn, it already exists(same page name) locally and has delete diffs
  2. when apply a 'delete' filetxn, its origin remote content and local content are different
     - TODO: we need to store origin remote content md5 in server db
  3. create version files only for files under 'journals/', 'pages/' dir"
  [^FileTxn filetxn origin-db-content]
  (go
    (cond
      (.renamed? filetxn)
      false
      (.-deleted? filetxn)
      false
      (.-updated? filetxn)
      (let [rpath (relative-path filetxn)
            repo (state/get-current-repo)
            repo-dir (config/get-repo-dir repo)
            content (<! (p->c (-> (fs/file-exists? repo-dir rpath)
                                  (p/then (fn [exists?]
                                            (when exists?
                                              (fs/read-file repo-dir rpath)))))))]
        (and (seq origin-db-content)
             (or (nil? content)
                 (some :removed (diff/diff origin-db-content content))))))))

(defn- <with-pause
  [ch *paused]
  (go-loop []
    (if @*paused
      {:pause true}
      (let [{:keys [timeout val]}
            (async/alt! ch ([v] {:val v})
                        (timeout 1000) {:timeout true})]
        (cond
          val val
          timeout (recur))))))




(defn- assert-local-txid<=remote-txid
  []
  (when-let [local-txid (last @graphs-txid)]
    (go (let [remote-txid (:TXId (<! (<get-remote-txid remoteapi (second @graphs-txid))))]
          (assert (<= local-txid remote-txid)
                  [@graphs-txid local-txid remote-txid])))))

(defn- get-local-files-checksum
  [graph-uuid base-path relative-paths]
  (go
    (into {}
          (map (juxt #(.-path ^FileMetadata %) #(.-etag ^FileMetadata %)))
          (<! (<get-local-files-meta rsapi graph-uuid base-path relative-paths)))))

(declare sync-state--add-current-local->remote-files
         sync-state--add-current-remote->local-files
         sync-state--remove-current-local->remote-files
         sync-state--remove-current-remote->local-files
         sync-state--add-recent-remote->local-files
         sync-state--remove-recent-remote->local-files
         sync-state--stopped?)


(defn- filetxns=>recent-remote->local-files
  [filetxns]
  (let [{:keys [update-filetxns delete-filetxns rename-filetxns]}
        (group-by (fn [^FileTxn e]
                    (cond
                      (.-updated? e) :update-filetxns
                      (.-deleted? e) :delete-filetxns
                      (.renamed? e)  :rename-filetxns)) filetxns)
        update-file-items (map
                           (fn [filetxn]
                             (let [path (relative-path filetxn)]
                               {:remote->local-type :update
                                :checksum (-checksum filetxn)
                                :path path}))
                           update-filetxns)
        rename-file-items (mapcat
                           (fn [^FileTxn filetxn]
                             (let [to-path (relative-path filetxn)
                                   from-path (.-from-path filetxn)]
                               [{:remote->local-type :update
                                 :checksum (-checksum filetxn)
                                 :path to-path}
                                {:remote->local-type :delete
                                 :checksum nil
                                 :path from-path}]))
                           rename-filetxns)
        delete-file-items (map
                           (fn [filetxn]
                             (let [path (relative-path filetxn)]
                               {:remote->local-type :delete
                                :checksum (-checksum filetxn)
                                :path path}))
                           delete-filetxns)]
    (set (concat update-file-items rename-file-items delete-file-items))))

(defn- <apply-remote-deletion
  "Apply remote deletion, if the file is not deleted locally, delete it locally.
   if the file is changed locally, leave the changed part.

   To replace <delete-local-files"
  [graph-uuid base-path relative-paths]
  (go
    (p->c (p/all (->> relative-paths
                      (map (fn [rpath]
                             (p/let [base-file (path/path-join "logseq/version-files/base" rpath)
                                     current-change-file rpath
                                     format (gp-util/get-format current-change-file)
                                     repo (state/get-current-repo)
                                     repo-dir (config/get-repo-dir repo)
                                     base-exists? (fs/file-exists? repo-dir base-file)]
                               (if base-exists?
                                 (p/let [base-content (fs/read-file repo-dir base-file)
                                         current-content (-> (fs/read-file repo-dir current-change-file)
                                                             (p/catch (fn [_] nil)))]
                                   (if (= base-content current-content)
                                     ;; base-content == current-content, delete current-change-file
                                     (p/do!
                                      (<delete-local-files rsapi graph-uuid base-path [rpath])
                                      (fs/unlink! repo (path/path-join repo-dir base-file) {}))
                                     ;; base-content != current-content, merge, do not delete
                                     (p/let [merged-content (diff-merge/three-way-merge base-content "" current-content format)]
                                       (fs/write-file! repo repo-dir current-change-file merged-content {:skip-compare? true})
                                       (file-handler/alter-file repo current-change-file merged-content {:re-render-root? true
                                                                                                         :from-disk? true
                                                                                                         :fs/event :fs/remote-file-change}))))

                                 ;; no base-version, use legacy approach, delete it
                                 (<delete-local-files rsapi graph-uuid base-path [rpath]))))))))))

(defn- <fetch-remote-and-update-local-files
  [graph-uuid base-path relative-paths]
  (go
    (let [fetched-file-rpaths-or-ex (<! (<fetch-remote-files rsapi graph-uuid base-path relative-paths))]
      (if (instance? ExceptionInfo fetched-file-rpaths-or-ex)
        fetched-file-rpaths-or-ex
        (<!
         (p->c (p/all (->> fetched-file-rpaths-or-ex
                           (map (fn [rpath]
                                  (p/let [incoming-file (path/path-join "logseq/version-files/incoming" rpath)
                                          base-file (path/path-join "logseq/version-files/base" rpath)
                                          current-change-file rpath
                                          format (gp-util/get-format current-change-file)
                                          repo (state/get-current-repo)
                                          repo-dir (config/get-repo-dir repo)
                                          base-exists? (fs/file-exists? repo-dir base-file)]
                                    (cond
                                      base-exists?
                                      (p/let [base-content (fs/read-file repo-dir base-file)
                                              current-content (-> (fs/read-file repo-dir current-change-file)
                                                                  (p/catch (fn [_] nil)))
                                              incoming-content (fs/read-file repo-dir incoming-file)]
                                        (if (= base-content current-content)
                                          (do
                                            (prn "[diff-merge]base=current, write directly")
                                            (p/do!
                                             (fs/copy! repo
                                                       (path/path-join repo-dir incoming-file)
                                                       (path/path-join repo-dir current-change-file))
                                             (fs/copy! repo
                                                       (path/path-join repo-dir incoming-file)
                                                       (path/path-join repo-dir base-file))
                                             (file-handler/alter-file repo current-change-file incoming-content {:re-render-root? true
                                                                                                                 :from-disk? true
                                                                                                                 :fs/event :fs/remote-file-change})))
                                          (do
                                            (prn "[diff-merge]base!=current, 3-way merge")
                                            (p/let [current-content (or current-content "")
                                                    incoming-content (fs/read-file repo-dir incoming-file)
                                                    merged-content (diff-merge/three-way-merge base-content incoming-content current-content format)]
                                              (when (seq merged-content)
                                                (p/do!
                                                 (fs/write-file! repo repo-dir current-change-file merged-content {:skip-compare? true})
                                                 (file-handler/alter-file repo current-change-file merged-content {:re-render-root? true
                                                                                                                   :from-disk? true
                                                                                                                   :fs/event :fs/remote-file-change})))))))

                                      :else
                                      (do
                                        (prn "[diff-merge]no base found, failback")
                                        (p/let [current-content (-> (fs/read-file repo-dir current-change-file)
                                                                    (p/catch (fn [_] nil)))
                                                current-content (or current-content "")
                                                incoming-content (fs/read-file repo-dir incoming-file)
                                                merged-content (diff-merge/three-way-merge current-content current-content incoming-content format)]
                                          (if (= incoming-content merged-content)
                                            (p/do!
                                             (fs/copy! repo
                                                       (path/path-join repo-dir incoming-file)
                                                       (path/path-join repo-dir current-change-file))
                                             (fs/copy! repo
                                                       (path/path-join repo-dir incoming-file)
                                                       (path/path-join repo-dir base-file))
                                             (file-handler/alter-file repo current-change-file merged-content {:re-render-root? true
                                                                                                               :from-disk? true
                                                                                                               :fs/event :fs/remote-file-change}))

                                          ;; else
                                            (p/do!
                                             (fs/write-file! repo repo-dir current-change-file merged-content {:skip-compare? true})
                                             (file-handler/alter-file repo current-change-file merged-content {:re-render-root? true
                                                                                                               :from-disk? true
                                                                                                               :fs/event :fs/remote-file-change})
                                             (file-handler/alter-file repo current-change-file merged-content {:re-render-root? true
                                                                                                               :from-disk? true
                                                                                                               :fs/event :fs/remote-file-change})))))))))))))))))

(defn- apply-filetxns
  [*sync-state graph-uuid base-path filetxns *paused]
  (go
    (cond
      (.renamed? (first filetxns))
      (let [^FileTxn filetxn (first filetxns)
            from-path (.-from-path filetxn)
            to-path (.-to-path filetxn)]
        (assert (= 1 (count filetxns)))
        (<! (<rename-local-file rsapi graph-uuid base-path
                                (relative-path from-path)
                                (relative-path to-path))))

      (.-updated? (first filetxns))
      (let [repo (state/get-current-repo)
            txn->db-content-vec (->> filetxns
                                     (mapv
                                      #(when (is-journals-or-pages? %)
                                         [% (db/get-file repo (relative-path %))]))
                                     (remove nil?))]

        (doseq [relative-p (map relative-path filetxns)]
          (when-some [relative-p*
                      (<! (<case-different-local-file-exist? graph-uuid rsapi base-path relative-p))]
            (let [recent-remote->local-file-item {:remote->local-type :delete
                                                  :checksum nil
                                                  :path relative-p*}]
              (println :debug "found case-different-same-local-file" relative-p relative-p*)
              (swap! *sync-state sync-state--add-recent-remote->local-files
                     [recent-remote->local-file-item])
              (<! (<delete-local-files rsapi graph-uuid base-path [relative-p*]))
              (go (<! (timeout 5000))
                (swap! *sync-state sync-state--remove-recent-remote->local-files
                       [recent-remote->local-file-item])))))

        (let [update-local-files-ch (if (state/enable-sync-diff-merge?)
                                      (<fetch-remote-and-update-local-files graph-uuid base-path (map relative-path filetxns))
                                      (<update-local-files rsapi graph-uuid base-path (map relative-path filetxns)))
              r (<! (<with-pause update-local-files-ch *paused))]
          (doseq [[filetxn origin-db-content] txn->db-content-vec]
            (when (<! (need-add-version-file? filetxn origin-db-content))
              (<! (<add-new-version rsapi repo (relative-path filetxn) origin-db-content))
              (put-sync-event! {:event :created-local-version-file
                                :data {:graph-uuid graph-uuid
                                       :repo repo
                                       :path (relative-path filetxn)
                                       :epoch (tc/to-epoch (t/now))}})))
          r))

      (.-deleted? (first filetxns))
      (let [filetxn (first filetxns)]
        (assert (= 1 (count filetxns)))
        (if (<! (<local-file-not-exist? graph-uuid rsapi base-path (relative-path filetxn)))
          ;; not exist, ignore
          true
          (let [r (<! (if (state/enable-sync-diff-merge?)
                        (<apply-remote-deletion graph-uuid base-path [(relative-path filetxn)])
                        (<delete-local-files rsapi graph-uuid base-path [(relative-path filetxn)])))]
            (if (and (instance? ExceptionInfo r)
                     (string/index-of (str (ex-cause r)) "No such file or directory"))
              true
              r)))))))

(declare sync-state-reset-full-remote->local-files)
(defn apply-filetxns-partitions
  "won't call <update-graphs-txid! when *txid is nil"
  [*sync-state user-uuid graph-uuid base-path filetxns-partitions repo *txid *stopped *paused full-sync?]
  (assert (some? *sync-state))

  (go-loop [filetxns-partitions* filetxns-partitions]
    (cond
      @*stopped {:stop true}
      @*paused  {:pause true}
      :else
      (when (seq filetxns-partitions*)
        (let [filetxns                        (first filetxns-partitions*)
              paths                           (map relative-path filetxns)
              recent-remote->local-file-items (filetxns=>recent-remote->local-files filetxns)
              _ (when-not full-sync?
                  (swap! *sync-state #(sync-state-reset-full-remote->local-files % recent-remote->local-file-items)))
              ;; update recent-remote->local-files
              _                               (swap! *sync-state sync-state--add-recent-remote->local-files
                                                     recent-remote->local-file-items)
              _                               (swap! *sync-state sync-state--add-current-remote->local-files paths)
              r                               (<! (apply-filetxns *sync-state graph-uuid base-path filetxns *paused))
              _                               (swap! *sync-state sync-state--remove-current-remote->local-files paths
                                                     (not (instance? ExceptionInfo r)))]
          ;; remove these recent-remote->local-file-items 5s later
          (go (<! (timeout 5000))
            (swap! *sync-state sync-state--remove-recent-remote->local-files
                   recent-remote->local-file-items))
          (cond
            (instance? ExceptionInfo r) r
            @*paused                    {:pause true}
            :else
            (let [latest-txid (apply max (and *txid @*txid) (map #(.-txid ^FileTxn %) filetxns))]
              ;; update local-txid
              (when (and *txid (number? latest-txid))
                (reset! *txid latest-txid)
                (<! (<update-graphs-txid! latest-txid graph-uuid user-uuid repo)))
              (recur (next filetxns-partitions*)))))))))

(defmulti need-sync-remote? (fn [v] (cond
                                      (= :max v)
                                      :max

                                      (and (vector? v) (number? (first v)))
                                      :txid

                                      (instance? ExceptionInfo v)
                                      :exceptional-response

                                      (instance? cljs.core.async.impl.channels/ManyToManyChannel v)
                                      :chan)))

(defmethod need-sync-remote? :max [_] true)
(defmethod need-sync-remote? :txid [[txid remote->local-syncer]]
  (let [remote-txid txid
        local-txid (.-txid remote->local-syncer)]
    (or (nil? local-txid)
        (> remote-txid local-txid))))

(defmethod need-sync-remote? :exceptional-response [resp]
  (let [data (ex-data resp)
        cause (ex-cause resp)]
    (or
     (and (= (:error data) :promise-error)
          (when-let [r (re-find #"(\d+), txid_to_validate = (\d+)" (str cause))]
            (> (nth r 1) (nth r 2))))
     (= 409 (get-in data [:err :status])))))

(defmethod need-sync-remote? :chan [c]
  (go (need-sync-remote? (<! c))))
(defmethod need-sync-remote? :default [_] false)

(defn- need-reset-local-txid?
  [r]
  (when-let [cause (ex-cause r)]
    (when-let [r (re-find #"(\d+), txid_to_validate = (\d+)" (str cause))]
      (< (nth r 1) (nth r 2)))))

(defn- graph-has-been-deleted?
  [r]
  (some->> (ex-cause r) str (re-find #"graph-not-exist")))

(defn- stop-sync-by-rsapi-response?
  [r]
  (some->> (ex-cause r) str (re-find #"Request is not yet valid")))


;; type = "change" | "add" | "unlink"
(deftype FileChangeEvent [type dir path stat checksum]
  IRelativePath
  (-relative-path [_] (remove-dir-prefix dir path))

  IEquiv
  (-equiv [_ ^FileChangeEvent other]
    (and (= dir (.-dir other))
         (= type (.-type other))
         (= path (.-path other))
         (= checksum (.-checksum other))))

  IHash
  (-hash [_]
    (hash {:dir dir
           :type type
           :path path
           :checksum checksum}))

  ILookup
  (-lookup [o k] (-lookup o k nil))
  (-lookup [_ k not-found]
    (case k
      :type type
      :dir  dir
      :path path
      :stat stat
      :checksum checksum
      not-found))

  IPrintWithWriter
  (-pr-writer [_ w _opts]
    (write-all w (str {:type type :base-path dir :path path :size (:size stat) :checksum checksum}))))


(defn- <file-change-event=>recent-remote->local-file-item
  "return nil when related local files not found"
  [graph-uuid ^FileChangeEvent e]
  (go
    (let [tp (case (.-type e)
               ("add" "change") :update
               "unlink" :delete)
          path (relative-path e)]
      (when-let [path-etag-entry (first (<! (get-local-files-checksum graph-uuid (.-dir e) [path])))]
        {:remote->local-type tp
         :checksum (if (= tp :delete) nil
                       (val path-etag-entry))
         :path path}))))

(defn- distinct-file-change-events-xf
  "transducer.
  distinct `FileChangeEvent`s by their path, keep the first one."
  [rf]
  (let [seen (volatile! #{})]
    (fn
      ([] (rf))
      ([result] (rf result))
      ([result ^FileChangeEvent e]
       (if (contains? @seen (.-path e))
         result
         (do (vswap! seen conj (.-path e))
             (rf result e)))))))

(defn- distinct-file-change-events
  "distinct `FileChangeEvent`s by their path, keep the last one."
  [es]
  (transduce distinct-file-change-events-xf conj '() (reverse es)))

(defn- partition-file-change-events
  "return transducer.
  partition `FileChangeEvent`s, at most N file-change-events in each partition.
  only one type in a partition."
  [n]
  (comp
   (partition-by (fn [^FileChangeEvent e]
                   (case (.-type e)
                     ("add" "change") :add-or-change
                     "unlink"         :unlink)))
   (map #(partition-all n %))
   cat))

(declare sync-state--valid-to-accept-filewatcher-event?)
(defonce local-changes-chan (chan (async/dropping-buffer 1000)))
(defn file-watch-handler
  "file-watcher callback"
  [type {:keys [dir path _content stat] :as _payload}]
  (when-let [current-graph (state/get-current-repo)]
    (when (string/ends-with? current-graph dir)
      (when-let [sync-state (state/get-file-sync-state (state/get-current-file-sync-graph-uuid))]
        (when (sync-state--valid-to-accept-filewatcher-event? sync-state)
          (when (or (:mtime stat) (= type "unlink"))
            (go
              (let [path (path-normalize path)
                    files-meta (and (not= "unlink" type)
                                    (<! (<get-local-files-meta
                                         rsapi (:current-syncing-graph-uuid sync-state) dir [path])))
                    checksum (and (coll? files-meta) (some-> files-meta first :etag))]
                (>! local-changes-chan (->FileChangeEvent type dir path stat checksum))))))))))

(defn local-changes-revised-chan-builder
  "return chan"
  [local-changes-chan rename-page-event-chan]
  (let [*rename-events (atom #{})
        ch (chan 1000)]
    (go-loop []
      (let [{:keys [rename-event local-change]}
            (async/alt!
             rename-page-event-chan ([v] {:rename-event v}) ;; {:repo X :old-path X :new-path}
             local-changes-chan ([v] {:local-change v}))]
        (cond
          rename-event
          (let [repo-dir (config/get-repo-dir (:repo rename-event))
                remove-dir-prefix-fn #(remove-dir-prefix repo-dir %)
                rename-event* (-> rename-event
                                  (update :old-path remove-dir-prefix-fn)
                                  (update :new-path remove-dir-prefix-fn))
                k1 [:old-path (:old-path rename-event*) repo-dir]
                k2 [:new-path (:new-path rename-event*) repo-dir]]
            (swap! *rename-events conj k1 k2)
            ;; remove rename-events after 2s
            (go (<! (timeout 3000))
              (swap! *rename-events disj k1 k2))
            ;; add 2 simulated file-watcher events
            (>! ch (->FileChangeEvent "unlink" repo-dir (:old-path rename-event*) nil nil))
            (>! ch (->FileChangeEvent "add" repo-dir (:new-path rename-event*)
                                      {:mtime (tc/to-long (t/now))
                                       :size 1 ; add a fake size
                                       } "fake-checksum"))
            (recur))
          local-change
          (cond
            (and (= "change" (.-type local-change))
                 (or (contains? @*rename-events [:old-path (.-path local-change) (.-dir local-change)])
                     (contains? @*rename-events [:new-path (.-path local-change) (.-dir local-change)])))
            (do (println :debug "ignore" local-change)
                ;; ignore
                (recur))

            (and (= "add" (.-type local-change))
                 (contains? @*rename-events [:new-path (.-path local-change) (.-dir local-change)]))
            ;; ignore
            (do (println :debug "ignore" local-change)
                (recur))
            (and (= "unlink" (.-type local-change))
                 (contains? @*rename-events [:old-path (.-path local-change) (.-dir local-change)]))
            (do (println :debug "ignore" local-change)
                (recur))
            :else
            (do (>! ch local-change)
                (recur))))))
    ch))

(defonce local-changes-revised-chan
  (local-changes-revised-chan-builder local-changes-chan (state/get-file-rename-event-chan)))

;;; ### encryption
(def pwd-map
  "graph-uuid->{:pwd xxx :public-key xxx :private-key xxx}"
  (atom {}))

(defonce *pwd-map-changed-chan
  (atom {}))

(defn- get-graph-pwd-changed-chan
  [graph-uuid]
  (if-let [result (get @*pwd-map-changed-chan graph-uuid)]
    result
    (let [c (chan (async/sliding-buffer 1))]
      (swap! *pwd-map-changed-chan assoc graph-uuid c)
      c)))

(defn- <encrypt-content
  [content key*]
  (p->c (encrypt/encrypt-with-passphrase key* content)))

(defn- decrypt-content
  [encrypted-content key*]
  (go
    (let [r (<! (p->c (encrypt/decrypt-with-passphrase key* encrypted-content)))]
      (when-not (instance? ExceptionInfo r) r))))

(defn- local-storage-pwd-path
  [graph-uuid]
  (str "encrypted-pwd/" graph-uuid))

(defn- persist-pwd!
  [pwd graph-uuid]
  {:pre [(string? pwd)]}
  (js/localStorage.setItem (local-storage-pwd-path graph-uuid) pwd))

(defn- remove-pwd!
  [graph-uuid]
  (js/localStorage.removeItem (local-storage-pwd-path graph-uuid)))

(defn get-pwd
  [graph-uuid]
  (js/localStorage.getItem (local-storage-pwd-path graph-uuid)))

(defn remove-all-pwd!
  []
  (doseq [k (filter #(string/starts-with? % "encrypted-pwd/") (js->clj (js-keys js/localStorage)))]
    (js/localStorage.removeItem k))
  (reset! pwd-map {}))


(defn encrypt+persist-pwd!
  "- persist encrypted pwd at local-storage"
  [pwd graph-uuid]
  (go
    (let [[value expired-at gone?]
          ((juxt :value :expired-at #(-> % ex-data :err :status (= 410)))
           (<! (<get-graph-salt-memoize remoteapi graph-uuid)))
          [salt-value _expired-at]
          (if gone?
            (let [r (<! (<create-graph-salt remoteapi graph-uuid))]
              (update-graph-salt-cache graph-uuid r)
              ((juxt :value :expired-at) r))
            [value expired-at])
          encrypted-pwd (<! (<encrypt-content pwd salt-value))]
      (persist-pwd! encrypted-pwd graph-uuid))))

(defn restore-pwd!
  "restore pwd from persisted encrypted-pwd, update `pwd-map`"
  [graph-uuid]
  (go
    (let [encrypted-pwd (get-pwd graph-uuid)]
      (if (nil? encrypted-pwd)
        {:restore-pwd-failed true}
        (let [[salt-value _expired-at gone?]
              ((juxt :value :expired-at #(-> % ex-data :err :status (= 410)))
               (<! (<get-graph-salt-memoize remoteapi graph-uuid)))]
          (if (or gone? (empty? salt-value))
            {:restore-pwd-failed "expired salt"}
            (let [pwd (<! (decrypt-content encrypted-pwd salt-value))]
              (if (nil? pwd)
                {:restore-pwd-failed (str "decrypt-pwd failed, salt: " salt-value)}
                (swap! pwd-map assoc-in [graph-uuid :pwd] pwd)))))))))

(defn- set-keys&notify
  [graph-uuid public-key private-key]
  (swap! pwd-map assoc-in [graph-uuid :public-key] public-key)
  (swap! pwd-map assoc-in [graph-uuid :private-key] private-key)
  (offer! (get-graph-pwd-changed-chan graph-uuid) true))

(defn- <set-graph-encryption-keys!
  [graph-uuid pwd public-key encrypted-private-key]
  (go
    (let [private-key (when (and pwd encrypted-private-key)
                        (<! (decrypt-content encrypted-private-key pwd)))]
      (when (and private-key (string/starts-with? private-key "AGE-SECRET-KEY"))
        (set-keys&notify graph-uuid public-key private-key)))))


(def <restored-pwd (chan (async/sliding-buffer 1)))
(def <restored-pwd-pub (async/pub <restored-pwd :graph-uuid))

(defn- <ensure-pwd-exists!
  "return password or nil when restore pwd from localstorage failed"
  [repo graph-uuid init-graph-keys]
  (go
    (let [{:keys [restore-pwd-failed]} (<! (restore-pwd! graph-uuid))
          pwd (get-in @pwd-map [graph-uuid :pwd])]
      (if restore-pwd-failed
        (do (state/pub-event! [:modal/remote-encryption-input-pw-dialog repo
                               (state/get-remote-graph-info-by-uuid graph-uuid)
                               :input-pwd-remote
                               {:GraphUUID graph-uuid
                                :init-graph-keys init-graph-keys
                                :after-input-password (fn [pwd]
                                                        (when pwd
                                                          (swap! pwd-map assoc-in [graph-uuid :pwd] pwd)
                                                          (offer! <restored-pwd {:graph-uuid graph-uuid :value true})))}])
            nil)
        pwd))))

(defn clear-pwd!
  "- clear pwd in `pwd-map`
  - remove encrypted-pwd in local-storage"
  [graph-uuid]
  (swap! pwd-map dissoc graph-uuid)
  (remove-pwd! graph-uuid))


(defn- <loop-ensure-pwd&keys
  [graph-uuid repo *stopped?]
  (let [<restored-pwd-sub-chan (chan 1)]
    (async/sub <restored-pwd-pub graph-uuid <restored-pwd-sub-chan)
    (go-loop []
      (if @*stopped?
        ::stop
        (let [{:keys [public-key encrypted-private-key] :as r}
              (<! (<get-graph-encrypt-keys-memoize remoteapi graph-uuid))
              init-graph-keys (some-> (ex-data r) :err :status (= 404))
              pwd (<! (<ensure-pwd-exists! repo graph-uuid init-graph-keys))]
          (cond
            (not pwd)
            (do (println :debug "waiting password...")
                (<! <restored-pwd-sub-chan)      ;loop to wait password
                (println :debug "waiting password...DONE" graph-uuid)
                (recur))

            init-graph-keys
            ;; when public+private keys not stored at server
            ;; generate a new key pair and upload them
            (let [next-state
                  (let [{public-key :publicKey private-key :secretKey}
                        (<! (<key-gen rsapi))
                        _ (assert (and public-key private-key) (str :public-key public-key :private-key private-key))
                        encrypted-private-key (<! (<encrypt-content private-key pwd))
                        _ (assert (string? encrypted-private-key)
                                  {:encrypted-private-key encrypted-private-key
                                   :private-key private-key
                                   :pwd pwd})
                        upload-r (<! (<upload-graph-encrypt-keys remoteapi graph-uuid public-key encrypted-private-key))]
                    (if (instance? ExceptionInfo upload-r)
                      (do (js/console.log "upload-graph-encrypt-keys err" upload-r)
                          ::stop)
                      (do (update-graph-encrypt-keys-cache graph-uuid {:public-key public-key
                                                                       :encrypted-private-key encrypted-private-key})
                          :recur)))]
              (if (= :recur next-state)
                (recur)
                next-state))

            :else
            ;; pwd, public-key, encrypted-private-key all exist
            (do (assert (and pwd public-key encrypted-private-key) {:encrypted-private-key encrypted-private-key
                                                                    :public-key public-key
                                                                    :pwd pwd})
                (<! (<set-graph-encryption-keys! graph-uuid pwd public-key encrypted-private-key))
                (if (get-in @pwd-map [graph-uuid :private-key])
                  (do (when (state/modal-opened?)
                        (state/set-state! [:ui/loading? :set-graph-password] false)
                        (state/close-modal!))
                      ::idle)
                  ;; bad pwd
                  (do (when (state/modal-opened?)
                        (when (state/sub [:ui/loading? :set-graph-password])
                          (state/set-state! [:file-sync/set-remote-graph-password-result]
                                            {:fail "Incorrect password. Please try again"}))
                        (state/set-state! [:ui/loading? :set-graph-password] false))
                      (clear-pwd! graph-uuid)
                      (recur))))))))))


(defn- <set-env&keys
  [prod? graph-uuid]
  (let [{:keys [private-key public-key]} (get @pwd-map graph-uuid)]
    (assert (and private-key public-key) (pr-str :private-key private-key :public-key public-key
                                                 :pwd-map @pwd-map))
    (<set-env rsapi graph-uuid prod? private-key public-key)))

(defn- <ensure-set-env&keys
  [graph-uuid *stopped?]
  (go-loop []
    (let [{:keys [change timeout]}
          (async/alt! (get-graph-pwd-changed-chan graph-uuid) {:change true}
                      (timeout 10000) {:timeout true})]
      (cond
        @*stopped? nil
        change (<! (<set-env&keys config/FILE-SYNC-PROD? graph-uuid))
        timeout (recur)))))

;;; ### chans to control sync process
(def full-sync-chan
  "offer `true` to this chan will trigger a local->remote full sync"
  (chan 1))
(def full-sync-mult (async/mult full-sync-chan))

(def remote->local-sync-chan
  "offer `true` to this chan will trigger a remote->local sync"
  (chan 1))
(def remote->local-sync-mult (async/mult remote->local-sync-chan))

(def remote->local-full-sync-chan
  "offer `true` to this chan will trigger a remote->local full sync"
  (chan 1))
(def remote->local-full-sync-mult (async/mult remote->local-full-sync-chan))

(def immediately-local->remote-chan
  "Immediately trigger upload of files in waiting queue"
  (chan))
(def immediately-local->remote-mult (async/mult immediately-local->remote-chan))

(def pause-resume-chan
  "false -> pause, true -> resume.
  see also `*resume-state`"
  (chan 1))
(def pause-resume-mult (async/mult pause-resume-chan))

(def recent-edited-chan
  "Triggered when there is content editing"
  (chan 1))
(def recent-edited-mult (async/mult recent-edited-chan))
(def last-input-time-cursor (rum/cursor state/state :editor/last-input-time))
(add-watch last-input-time-cursor "sync"
           (fn [_ _ _ _]
             (offer! recent-edited-chan true)))


;;; ### sync state

(def *resume-state
  "key: graph-uuid"
  (atom {}))

(defn resume-state--add-remote->local-state
  [graph-uuid]
  (swap! *resume-state assoc graph-uuid {:remote->local true}))

(defn resume-state--add-remote->local-full-sync-state
  [graph-uuid]
  (swap! *resume-state assoc graph-uuid {:remote->local-full-sync true}))

(defn resume-state--add-local->remote-state
  [graph-uuid local-changes]
  (swap! *resume-state assoc graph-uuid {:local->remote local-changes}))

;; (defn resume-state--add-local->remote-full-sync-state
;;   [graph-uuid]
;;   (swap! *resume-state assoc graph-uuid {:local->remote-full-sync true}))

(defn resume-state--reset
  [graph-uuid]
  (swap! *resume-state dissoc graph-uuid))

(defn sync-state
  "create a new sync-state"
  []
  {:post [(s/valid? ::sync-state %)]}
  {:current-syncing-graph-uuid  nil
   :state                       ::starting
   :full-local->remote-files    #{}
   :current-local->remote-files #{}
   :full-remote->local-files    #{}
   :current-remote->local-files #{}
   :queued-local->remote-files  #{}
   :recent-remote->local-files  #{}
   :history                     '()})

(defn- sync-state--update-current-syncing-graph-uuid
  [sync-state graph-uuid]
  {:pre  [(s/valid? ::sync-state sync-state)]
   :post [(s/valid? ::sync-state %)]}
  (assoc sync-state :current-syncing-graph-uuid graph-uuid))

(defn- sync-state--update-state
  [sync-state next-state]
  {:pre  [(s/valid? ::state next-state)]
   :post [(s/valid? ::sync-state %)]}
  (assoc sync-state :state next-state))

(defn sync-state--add-current-remote->local-files
  [sync-state paths]
  {:post [(s/valid? ::sync-state %)]}
  (update sync-state :current-remote->local-files into paths))

(defn sync-state--add-current-local->remote-files
  [sync-state paths]
  {:post [(s/valid? ::sync-state %)]}
  (update sync-state :current-local->remote-files into paths))

(defn sync-state--add-queued-local->remote-files
  [sync-state event]
  {:post [(s/valid? ::sync-state %)]}
  (update sync-state :queued-local->remote-files
          (fn [o event]
            (->> (concat o [event])
                 (util/distinct-by-last-wins (fn [e] (.-path e))))) event))

(defn sync-state--remove-queued-local->remote-files
  [sync-state event]
  {:post [(s/valid? ::sync-state %)]}
  (update sync-state :queued-local->remote-files
          (fn [o event]
            (remove #{event} o)) event))

(defn sync-state-reset-queued-local->remote-files
  [sync-state]
  {:post [(s/valid? ::sync-state %)]}
  (assoc sync-state :queued-local->remote-files nil))

(defn sync-state--add-recent-remote->local-files
  [sync-state items]
  {:pre [(s/valid? (s/coll-of ::recent-remote->local-file-item) items)]
   :post [(s/valid? ::sync-state %)]}
  (update sync-state :recent-remote->local-files (partial apply conj) items))

(defn sync-state--remove-recent-remote->local-files
  [sync-state items]
  {:post [(s/valid? ::sync-state %)]}
  (update sync-state :recent-remote->local-files set/difference items))

(defn sync-state-reset-full-local->remote-files
  [sync-state events]
  {:post [(s/valid? ::sync-state %)]}
  (assoc sync-state :full-local->remote-files events))

(defn sync-state-reset-full-remote->local-files
  [sync-state events]
  {:post [(s/valid? ::sync-state %)]}
  (assoc sync-state :full-remote->local-files events))

(defn- add-history-items
  [history paths now]
  (sequence
   (comp
    ;; only reserve the latest one of same-path-items
    (dedupe-by :path)
    ;; reserve the latest 20 history items
    (take 20))
   (into (filter (fn [o]
                   (not (contains? (set paths) (:path o)))) history)
         (map (fn [path] {:path path :time now}) paths))))

(defn sync-state--remove-current-remote->local-files
  [sync-state paths add-history?]
  {:post [(s/valid? ::sync-state %)]}
  (let [now (t/now)]
    (cond-> sync-state
      true         (update :current-remote->local-files set/difference paths)
      add-history? (update :history add-history-items paths now))))

(defn sync-state--remove-current-local->remote-files
  [sync-state paths add-history?]
  {:post [(s/valid? ::sync-state %)]}
  (let [now (t/now)]
    (cond-> sync-state
      true         (update :current-local->remote-files set/difference paths)
      add-history? (update :history add-history-items paths now))))

(defn sync-state--stopped?
  "Graph syncing is stopped"
  [sync-state]
  {:pre [(s/valid? ::sync-state sync-state)]}
  (= ::stop (:state sync-state)))

(defn sync-state--valid-to-accept-filewatcher-event?
  [sync-state]
  {:pre [(s/valid? ::sync-state sync-state)]}
  (contains? #{::idle ::local->remote ::remote->local ::local->remote-full-sync ::remote->local-full-sync}
             (:state sync-state)))


;;; ### remote->local syncer & local->remote syncer

(defprotocol IRemote->LocalSync
  (stop-remote->local! [this])
  (<sync-remote->local! [this] "return ExceptionInfo when error occurs")
  (<sync-remote->local-all-files! [this] "sync all files, return ExceptionInfo when error occurs"))

(defprotocol ILocal->RemoteSync
  (setup-local->remote! [this])
  (stop-local->remote! [this])
  (<ratelimit [this from-chan] "get watched local file-change events from FROM-CHAN,
  return chan returning events with rate limited")
  (<sync-local->remote! [this es] "es is a sequence of `FileChangeEvent`, all items have same type.")
  (<sync-local->remote-all-files! [this] "compare all local files to remote ones, sync when not equal.
  if local-txid != remote-txid, return {:need-sync-remote true}"))

(defrecord ^:large-vars/cleanup-todo
  Remote->LocalSyncer [user-uuid graph-uuid base-path repo *txid *txid-for-get-deletion-log *sync-state remoteapi
                       ^:mutable local->remote-syncer *stopped *paused]
  Object
  (set-local->remote-syncer! [_ s] (set! local->remote-syncer s))
  (sync-files-remote->local!
    [_ relative-filepath+checksum-coll latest-txid]
    (go
      (let [partitioned-filetxns
            (sequence (filepath+checksum-coll->partitioned-filetxns
                       download-batch-size graph-uuid user-uuid)
                      relative-filepath+checksum-coll)
            r
            (if (empty? (flatten partitioned-filetxns))
              {:succ true}
              (do
                (put-sync-event! {:event :start
                                  :data  {:type       :full-remote->local
                                          :graph-uuid graph-uuid
                                          :full-sync? true
                                          :epoch      (tc/to-epoch (t/now))}})
                (<! (apply-filetxns-partitions
                     *sync-state user-uuid graph-uuid base-path partitioned-filetxns repo
                     nil *stopped *paused true))))]
        (cond
          (instance? ExceptionInfo r) {:unknown r}
          @*stopped                   {:stop true}
          @*paused                    {:pause true}
          :else
          (do
            (swap! *sync-state #(sync-state-reset-full-remote->local-files % []))
            (<! (<update-graphs-txid! latest-txid graph-uuid user-uuid repo))
            (reset! *txid latest-txid)
            {:succ true})))))

  IRemote->LocalSync
  (stop-remote->local! [_] (vreset! *stopped true))
  (<sync-remote->local! [_]
    (go
      (let [r
            (let [diff-r (<! (<get-diff remoteapi graph-uuid @*txid))]
              (if (instance? ExceptionInfo diff-r)
                diff-r
                (let [[diff-txns latest-txid min-txid] diff-r]
                  (if (> (dec min-txid) @*txid) ;; min-txid-1 > @*txid, need to remote->local-full-sync
                    (do (println "min-txid" min-txid "request-txid" @*txid)
                        {:need-remote->local-full-sync true})

                    (when (pos-int? latest-txid)
                      (let [filtered-diff-txns (-> (transduce (diffs->filetxns) conj '() (reverse diff-txns))
                                                   filter-download-files-with-reserved-chars)
                            partitioned-filetxns (transduce (partition-filetxns download-batch-size)
                                                            (completing (fn [r i] (conj r (reverse i)))) ;reverse
                                                            '()
                                                            filtered-diff-txns)]
                        (put-sync-event! {:event :start
                                          :data  {:type       :remote->local
                                                  :graph-uuid graph-uuid
                                                  :full-sync? false
                                                  :epoch      (tc/to-epoch (t/now))}})
                        (if (empty? (flatten partitioned-filetxns))
                          (do
                            (swap! *sync-state #(sync-state-reset-full-remote->local-files % []))
                            (<! (<update-graphs-txid! latest-txid graph-uuid user-uuid repo))
                            (reset! *txid latest-txid)
                            {:succ true})
                          (<! (apply-filetxns-partitions
                               *sync-state user-uuid graph-uuid base-path
                               partitioned-filetxns repo *txid *stopped *paused false)))))))))]
        (cond
          (instance? ExceptionInfo r)       {:unknown r}
          @*stopped                         {:stop true}
          @*paused                          {:pause true}
          (:need-remote->local-full-sync r) r
          :else                             {:succ true}))))

  (<sync-remote->local-all-files! [this]
    (go
      (let [remote-all-files-meta-c      (<get-remote-all-files-meta remoteapi graph-uuid)
            local-all-files-meta-c       (<get-local-all-files-meta rsapi graph-uuid base-path)
            remote-all-files-meta-or-exp (<! remote-all-files-meta-c)]
        (if (or (storage-exceed-limit? remote-all-files-meta-or-exp)
                (sync-stop-when-api-flying? remote-all-files-meta-or-exp)
                (decrypt-exp? remote-all-files-meta-or-exp))
          (do (put-sync-event! {:event :exception-decrypt-failed
                                :data  {:graph-uuid graph-uuid
                                        :exp        remote-all-files-meta-or-exp
                                        :epoch      (tc/to-epoch (t/now))}})
              {:stop true})
          (let [remote-all-files-meta   remote-all-files-meta-or-exp
                local-all-files-meta    (<! local-all-files-meta-c)
                {diff-remote-files :result elapsed-time :time}
                (util/with-time (diff-file-metadata-sets remote-all-files-meta local-all-files-meta))
                _ (println ::diff-file-metadata-sets-elapsed-time elapsed-time "ms")
                recent-10-days-range    ((juxt #(tc/to-long (t/minus % (t/days 10))) #(tc/to-long %)) (t/today))
                sorted-diff-remote-files
                                        (sort-by
                                         (sort-file-metadata-fn :recent-days-range recent-10-days-range) > diff-remote-files)
                remote-txid-or-ex       (<! (<get-remote-txid remoteapi graph-uuid))
                latest-txid             (:TXId remote-txid-or-ex)]
            (if (or (instance? ExceptionInfo remote-txid-or-ex) (nil? latest-txid))
              (do (put-sync-event! {:event :get-remote-graph-failed
                                    :data {:graph-uuid graph-uuid
                                           :exp remote-txid-or-ex
                                           :epoch (tc/to-epoch (t/now))}})
                  {:stop true})
              (do (println "[full-sync(remote->local)]" (count sorted-diff-remote-files) "files need to sync")
                  (let [filtered-files (filter-download-files-with-reserved-chars sorted-diff-remote-files)]
                    (swap! *sync-state #(sync-state-reset-full-remote->local-files % sorted-diff-remote-files))
                    (<! (.sync-files-remote->local!
                         this (map (juxt relative-path -checksum)
                                   filtered-files)
                         latest-txid)))))))))))

(defn- <file-changed?
  "return true when file changed compared with remote"
  [graph-uuid file-path-without-base-path base-path]
  {:pre [(string? file-path-without-base-path)]}
  (go
    (let [remote-meta-or-exp (<! (<get-remote-files-meta remoteapi graph-uuid [file-path-without-base-path]))
          local-meta (first (<! (<get-local-files-meta rsapi graph-uuid base-path [file-path-without-base-path])))]
      (if (instance? ExceptionInfo remote-meta-or-exp)
        false
        (not= (first remote-meta-or-exp) local-meta)))))

(defn- <filter-local-changes-pred
  "filter local-change events:
  - for 'unlink' event
    - when related file exists on local dir, ignore this event
  - for 'add' | 'change' event
    - when related file's content is same as remote file, ignore it"
  [^FileChangeEvent e basepath graph-uuid]
  (go
    (let [r-path (relative-path e)]
      (case (.-type e)
        "unlink"
        ;; keep this e when it's not found
        (<! (<local-file-not-exist? graph-uuid rsapi basepath r-path))

        ("add" "change")
        ;; 1. local file exists
        ;; 2. compare with remote file, and changed
        (and (not (<! (<local-file-not-exist? graph-uuid rsapi basepath r-path)))
             (<! (<file-changed? graph-uuid r-path basepath)))))))

(defn- <filter-checksum-not-consistent
  "filter out FileChangeEvents checksum changed,
  compare checksum in FileChangeEvent and checksum calculated now"
  [graph-uuid es]
  {:pre [(or (nil? es) (coll? es))
         (every? #(instance? FileChangeEvent %) es)]}
  (go
    (when (seq es)
      (if (= "unlink" (.-type ^FileChangeEvent (first es)))
        es
        (let [base-path            (.-dir (first es))
              files-meta           (<! (<get-local-files-meta
                                        rsapi graph-uuid base-path (mapv relative-path es)))
              current-checksum-map (when (coll? files-meta) (into {} (mapv (juxt :path :etag) files-meta)))
              origin-checksum-map  (into {} (mapv (juxt relative-path #(.-checksum ^FileChangeEvent %)) es))
              origin-map           (into {} (mapv (juxt relative-path identity) es))]
          (->>
           (merge-with
            #(boolean (or (nil? %1) (= "fake-checksum" %1) (= %1 %2)))
            origin-checksum-map current-checksum-map)
           (filterv (comp true? second))
           (mapv first)
           (select-keys origin-map)
           vals))))))

(def ^:private file-size-limit (* 100 1000 1024)) ;100MB
(defn- filter-too-huge-files-aux
  [e]
  {:post [(boolean? %)]}
  (if (= "unlink" (.-type ^FileChangeEvent e))
    true
    (boolean
     (when-some [size (:size (.-stat e))]
       (< size file-size-limit)))))

(defn- filter-too-huge-files
  "filter out files > `file-size-limit`"
  [es]
  {:pre [(or (nil? es) (coll? es))
         (every? #(instance? FileChangeEvent %) es)]}
  (filterv filter-too-huge-files-aux es))

(defn- filter-local-files-in-deletion-logs
  [local-all-files-meta deletion-logs remote-all-files-meta]
  (let [deletion-logs-map (into {}
                                (mapcat
                                 (fn [log]
                                   (mapv
                                    (fn [path] [path (select-keys log [:epoch :TXId])])
                                    (:paths log))))
                                deletion-logs)
        remote-all-files-meta-map (into {} (map (juxt :path identity)) remote-all-files-meta)
        *keep             (transient #{})
        *delete           (transient #{})
        filtered-deletion-logs-map
        (loop [[deletion-log & others] deletion-logs-map
               result {}]
          (if-not deletion-log
            result
            (let [[deletion-log-path deletion-log-meta] deletion-log
                  meta (get remote-all-files-meta-map deletion-log-path)
                  meta-txid (:txid meta)
                  deletion-txid (:TXId deletion-log-meta)]
              (if (and meta-txid deletion-txid
                       (> meta-txid deletion-txid))
                (recur others result)
                (recur others (into result [[deletion-log-path deletion-log-meta]]))))))]
    (doseq [f local-all-files-meta]
      (let [epoch-long (some-> (get filtered-deletion-logs-map (:path f))
                               :epoch
                               (* 1000))]
        (if (and epoch-long (> epoch-long (:last-modified f)))
          (conj! *delete f)
          (conj! *keep f))))
    {:keep   (persistent! *keep)
     :delete (persistent! *delete)}))

(defn- <filter-too-long-filename
  [graph-uuid local-files-meta]
  (go (let [origin-fnames    (mapv :path local-files-meta)
            encrypted-fnames (<! (<encrypt-fnames rsapi graph-uuid origin-fnames))
            fnames-map (zipmap origin-fnames encrypted-fnames)
            local-files-meta-map (into {} (map (fn [meta] [(:path meta) meta])) local-files-meta)]
        (sequence
         (comp
          (filter
           (fn [[path _]]
             ; 950 = (- 1024 36 36 2)
             ; 1024 - length of 'user-uuid/graph-uuid/'
             (<= (count (get fnames-map path)) 950)))
          (map second))
         local-files-meta-map))))

(defrecord ^:large-vars/cleanup-todo
  Local->RemoteSyncer [user-uuid graph-uuid base-path repo *sync-state remoteapi
                       ^:mutable rate *txid *txid-for-get-deletion-log
                       ^:mutable remote->local-syncer stop-chan *stopped *paused
                       ;; control chans
                       private-immediately-local->remote-chan private-recent-edited-chan]
  Object
  (filter-file-change-events-fn [_]
    (fn [^FileChangeEvent e]
      (go (and (instance? FileChangeEvent e)
               (if-let [mtime (:mtime (.-stat e))]
                 ;; if mtime is not nil, it should be after (- now 1min)
                 ;; ignore events too early
                 (> (* 1000 mtime) (tc/to-long (t/minus (t/now) (t/minutes 1))))
                 true)
               (or (string/starts-with? (.-dir e) base-path)
                   (string/starts-with? (str "file://" (.-dir e)) base-path)) ; valid path prefix
               (not (ignored? e))       ;not ignored
               ;; download files will also trigger file-change-events, ignore them
               (if (= "unlink" (:type e))
                 true
                 (when-some [recent-remote->local-file-item
                             (<! (<file-change-event=>recent-remote->local-file-item
                                  graph-uuid e))]
                   (not (contains? (:recent-remote->local-files @*sync-state) recent-remote->local-file-item))))))))

  (set-remote->local-syncer! [_ s] (set! remote->local-syncer s))

  ILocal->RemoteSync
  (setup-local->remote! [_]
    (async/tap immediately-local->remote-mult private-immediately-local->remote-chan)
    (async/tap recent-edited-mult private-recent-edited-chan))

  (stop-local->remote! [_]
    (async/untap immediately-local->remote-mult private-immediately-local->remote-chan)
    (async/untap recent-edited-mult private-recent-edited-chan)
    (async/close! stop-chan)
    (vreset! *stopped true))

  (<ratelimit [this from-chan]
    (let [<fast-filter-e-fn (.filter-file-change-events-fn this)]
      (util/<ratelimit
       from-chan rate
       :filter-fn
       (fn [e]
         (go
           (and (rsapi-ready? rsapi graph-uuid)
                (<! (<fast-filter-e-fn e))
                (do
                  (swap! *sync-state sync-state--add-queued-local->remote-files e)
                  (let [v (<! (<filter-local-changes-pred e base-path graph-uuid))]
                    (when-not v
                      (swap! *sync-state sync-state--remove-queued-local->remote-files e))
                    v)))))
       :flush-fn #(swap! *sync-state sync-state-reset-queued-local->remote-files)
       :stop-ch stop-chan
       :distinct-coll? true
       :flush-now-ch private-immediately-local->remote-chan
       :refresh-timeout-ch private-recent-edited-chan)))

  (<sync-local->remote! [_ es]
    (if (empty? es)
      (go {:succ true})
      (let [type         (.-type ^FileChangeEvent (first es))
            es->paths-xf (comp
                          (map #(relative-path %))
                          (remove ignored?))]
        (go
          (let [es*   (<! (<filter-checksum-not-consistent graph-uuid es))
                _     (when (not= (count es*) (count es))
                        (println :debug :filter-checksum-changed
                                 (mapv relative-path (set/difference (set es) (set es*)))))
                es**  (filter-too-huge-files es*)
                _     (when (not= (count es**) (count es*))
                        (println :debug :filter-too-huge-files
                                 (mapv relative-path (set/difference (set es*) (set es**)))))
                paths (cond-> (sequence es->paths-xf es**)
                        (not= type "unlink")
                        filter-upload-files-with-reserved-chars)
                _     (println :sync-local->remote type paths)
                r     (if (empty? paths)
                        (go @*txid)
                        (case type
                          ("add" "change")
                          (<with-pause (<update-remote-files rsapi graph-uuid base-path paths @*txid) *paused)

                          "unlink"
                          (<with-pause (<delete-remote-files rsapi graph-uuid base-path paths @*txid) *paused)))
                _               (swap! *sync-state sync-state--add-current-local->remote-files paths)
                r*              (<! r)
                [succ? paused?] ((juxt number? :pause) r*)
                _               (swap! *sync-state sync-state--remove-current-local->remote-files paths succ?)]
            (cond
              (need-sync-remote? r*)
              (do (println :need-sync-remote r*)
                  {:need-sync-remote true})

              (need-reset-local-txid? r*) ;; TODO: this cond shouldn't be true,
              ;; but some potential bugs cause local-txid > remote-txid
              (let [remote-txid-or-ex (<! (<get-remote-txid remoteapi graph-uuid))
                    remote-txid             (:TXId remote-txid-or-ex)]
                (if (or (instance? ExceptionInfo remote-txid-or-ex) (nil? remote-txid))
                  (do (put-sync-event! {:event :get-remote-graph-failed
                                        :data  {:graph-uuid graph-uuid
                                                :exp        remote-txid-or-ex
                                                :epoch      (tc/to-epoch (t/now))}})
                      {:stop true})
                  (do (<! (<update-graphs-txid! remote-txid graph-uuid user-uuid repo))
                      (reset! *txid remote-txid)
                      {:succ true})))

              (graph-has-been-deleted? r*)
              (do (println :graph-has-been-deleted r*)
                  {:graph-has-been-deleted true})

              (stop-sync-by-rsapi-response? r*)
              (do (println :stop-sync-caused-by-rsapi-err-response r*)
                  (notification/show! (t :file-sync/rsapi-cannot-upload-err) :warning false)
                  {:stop true})

              paused?
              {:pause true}

              succ?                     ; succ
              (do
                (println "sync-local->remote! update txid" r*)
                ;; persist txid
                (<! (<update-graphs-txid! r* graph-uuid user-uuid repo))
                (reset! *txid r*)
                {:succ true})

              :else
              (do
                (println "sync-local->remote unknown:" r*)
                {:unknown r*})))))))

  (<sync-local->remote-all-files! [this]
    (go
      (let [remote-all-files-meta-c      (<get-remote-all-files-meta remoteapi graph-uuid)
            local-all-files-meta-c       (<get-local-all-files-meta rsapi graph-uuid base-path)
            deletion-logs-c              (<get-deletion-logs remoteapi graph-uuid @*txid-for-get-deletion-log)
            remote-all-files-meta-or-exp (<! remote-all-files-meta-c)
            deletion-logs-or-exp         (<! deletion-logs-c)]
        (cond
          (or (storage-exceed-limit? remote-all-files-meta-or-exp)
              (sync-stop-when-api-flying? remote-all-files-meta-or-exp)
              (decrypt-exp? remote-all-files-meta-or-exp))
          (do (put-sync-event! {:event :get-remote-all-files-failed
                                :data  {:graph-uuid graph-uuid
                                        :exp        remote-all-files-meta-or-exp
                                        :epoch      (tc/to-epoch (t/now))}})
              {:stop true})

          (instance? ExceptionInfo deletion-logs-or-exp)
          (do (put-sync-event! {:event :get-deletion-logs-failed
                                :data  {:graph-uuid graph-uuid
                                        :exp        deletion-logs-or-exp
                                        :epoch      (tc/to-epoch (t/now))}})
              {:stop true})

          :else
          (let [remote-all-files-meta  remote-all-files-meta-or-exp
                local-all-files-meta   (<! local-all-files-meta-c)
                {local-all-files-meta :keep delete-local-files :delete}
                (filter-local-files-in-deletion-logs local-all-files-meta deletion-logs-or-exp remote-all-files-meta)
                recent-10-days-range   ((juxt #(tc/to-long (t/minus % (t/days 10))) #(tc/to-long %)) (t/today))
                diff-local-files       (->> (diff-file-metadata-sets local-all-files-meta remote-all-files-meta)
                                            (<filter-too-long-filename graph-uuid)
                                            <!
                                            (sort-by (sort-file-metadata-fn :recent-days-range recent-10-days-range) >))
                change-events
                                       (sequence
                                        (comp
                                         ;; convert to FileChangeEvent
                                         (map #(->FileChangeEvent "change" base-path (.get-normalized-path ^FileMetadata %)
                                                                  {:size (:size %)} (:etag %)))
                                         (remove ignored?))
                                        diff-local-files)
                distinct-change-events (-> (distinct-file-change-events change-events)
                                           filter-upload-files-with-reserved-chars)
                _                      (swap! *sync-state #(sync-state-reset-full-local->remote-files % distinct-change-events))
                change-events-partitions
                                       (sequence
                                        ;; partition FileChangeEvents
                                        (partition-file-change-events upload-batch-size)
                                        distinct-change-events)]
            (println "[full-sync(local->remote)]"
                     (count (flatten change-events-partitions)) "files need to sync and"
                     (count delete-local-files) "local files need to delete")
            (put-sync-event! {:event :start
                              :data  {:type       :full-local->remote
                                      :graph-uuid graph-uuid
                                      :full-sync? true
                                      :epoch      (tc/to-epoch (t/now))}})
            ;; 1. delete local files
            (loop [[f & fs] delete-local-files]
              (when f
                (let [relative-p (relative-path f)]
                  (when-not (<! (<local-file-not-exist? graph-uuid rsapi base-path relative-p))
                    (let [fake-recent-remote->local-file-item {:remote->local-type :delete
                                                               :checksum           nil
                                                               :path               relative-p}]
                      (swap! *sync-state sync-state--add-recent-remote->local-files
                             [fake-recent-remote->local-file-item])
                      (<! (<delete-local-files rsapi graph-uuid base-path [(relative-path f)]))
                      (go (<! (timeout 5000))
                        (swap! *sync-state sync-state--remove-recent-remote->local-files
                               [fake-recent-remote->local-file-item])))))
                (recur fs)))

            ;; 2. upload local files
            (let [r (loop [es-partitions change-events-partitions]
                      (if @*stopped
                        {:stop true}
                        (if (empty? es-partitions)
                          {:succ true}
                          (let [{:keys [succ need-sync-remote graph-has-been-deleted unknown stop] :as r}
                                (<! (<sync-local->remote! this (first es-partitions)))]
                            (s/assert ::sync-local->remote!-result r)
                            (cond
                              succ
                              (recur (next es-partitions))
                              (or need-sync-remote graph-has-been-deleted unknown stop) r)))))]
              ;; update *txid-for-get-deletion-log
              (reset! *txid-for-get-deletion-log @*txid)
              r
              )))))))

;;; ### put all stuff together

(defrecord ^:large-vars/cleanup-todo
    SyncManager [user-uuid graph-uuid base-path *sync-state
              ^Local->RemoteSyncer local->remote-syncer ^Remote->LocalSyncer remote->local-syncer remoteapi
              ^:mutable ratelimit-local-changes-chan
              *txid *txid-for-get-deletion-log
              ^:mutable state ^:mutable remote-change-chan ^:mutable *ws *stopped? *paused?
              ^:mutable ops-chan ^:mutable app-awake-from-sleep-chan
               ;; control chans
              private-full-sync-chan private-remote->local-sync-chan
              private-remote->local-full-sync-chan private-pause-resume-chan]
  Object
  (schedule [this next-state args reason]
    {:pre [(s/valid? ::state next-state)]}
    (println (str "[SyncManager " graph-uuid "]")
             (and state (name state)) "->" (and next-state (name next-state)) :reason reason :local-txid @*txid :args args :now (tc/to-string (t/now)))
    (set! state next-state)
    (swap! *sync-state sync-state--update-state next-state)
    (go
      (case state
        ::need-password
        (<! (.need-password this))
        ::idle
        (<! (.idle this))
        ::local->remote
        (<! (.local->remote this args))
        ::remote->local
        (<! (.remote->local this nil args))
        ::local->remote-full-sync
        (<! (.full-sync this))
        ::remote->local-full-sync
        (<! (.remote->local-full-sync this args))
        ::pause
        (<! (.pause this))
        ::stop
        (-stop! this))))

  (start [this]
    (set! ops-chan (chan (async/dropping-buffer 10)))
    (set! app-awake-from-sleep-chan (chan (async/sliding-buffer 1)))
    (set! *ws (atom nil))
    (set! remote-change-chan (ws-listen! graph-uuid *ws))
    (set! ratelimit-local-changes-chan (<ratelimit local->remote-syncer local-changes-revised-chan))
    (setup-local->remote! local->remote-syncer)
    (async/tap full-sync-mult private-full-sync-chan)
    (async/tap remote->local-sync-mult private-remote->local-sync-chan)
    (async/tap remote->local-full-sync-mult private-remote->local-full-sync-chan)
    (async/tap pause-resume-mult private-pause-resume-chan)
    (async/tap pubsub/app-wake-up-from-sleep-mult app-awake-from-sleep-chan)
    (go-loop []
      (let [{:keys [remote->local remote->local-full-sync local->remote-full-sync local->remote resume pause stop]}
            (async/alt!
              private-remote->local-full-sync-chan {:remote->local-full-sync true}
              private-remote->local-sync-chan {:remote->local true}
              private-full-sync-chan {:local->remote-full-sync true}
              private-pause-resume-chan ([v] (if v {:resume true} {:pause true}))
              remote-change-chan ([v] (println "remote change:" v) {:remote->local v})
              ratelimit-local-changes-chan ([v]
                                            (if (nil? v)
                                              {:stop true}
                                              (let [rest-v (util/drain-chan ratelimit-local-changes-chan)
                                                    vs     (cons v rest-v)]
                                                (println "local changes:" vs)
                                                {:local->remote vs})))
              app-awake-from-sleep-chan {:remote->local true}
              (timeout (* 20 60 1000)) {:local->remote-full-sync true}
              (timeout (* 10 60 1000)) {:remote->local true}
              :priority true)]
        (cond
          stop
          nil

          remote->local-full-sync
          (do (util/drain-chan ops-chan)
              (>! ops-chan {:remote->local-full-sync true})
              (recur))
          remote->local
          (let [txid
                (if (true? remote->local)
                  {:txid (:TXId (<! (<get-remote-txid remoteapi graph-uuid)))}
                  remote->local)]
            (when (some? txid)
              (>! ops-chan {:remote->local txid}))
            (recur))
          local->remote
          (do (>! ops-chan {:local->remote local->remote})
              (recur))
          local->remote-full-sync
          (do (util/drain-chan ops-chan)
              (>! ops-chan {:local->remote-full-sync true})
              (recur))
          resume
          (do (>! ops-chan {:resume true})
              (recur))
          pause
          (do (vreset! *paused? true)
              (>! ops-chan {:pause true})
              (recur)))))
    (.schedule this ::need-password nil nil))

  (need-password
    [this]
    (go
      (let [next-state (<! (<loop-ensure-pwd&keys graph-uuid (state/get-current-repo) *stopped?))]
        (assert (s/valid? ::state next-state) next-state)
        (when (= next-state ::idle)
          (<! (<ensure-set-env&keys graph-uuid *stopped?)))
        (if @*stopped?
          (.schedule this ::stop nil nil)
          (.schedule this next-state nil nil)))))

  (pause [this]
    (go (<! (<rsapi-cancel-all-requests)))
    (put-sync-event! {:event :pause
                      :data  {:graph-uuid graph-uuid
                              :epoch      (tc/to-epoch (t/now))}})
    (go-loop []
      (let [{:keys [resume] :as result} (<! ops-chan)]
        (cond
          resume
          (let [{:keys [remote->local remote->local-full-sync local->remote local->remote-full-sync] :as resume-state}
                (get @*resume-state graph-uuid)]
            (resume-state--reset graph-uuid)
            (vreset! *paused? false)
            (cond
              remote->local
              (offer! private-remote->local-sync-chan true)
              remote->local-full-sync
              (offer! private-remote->local-full-sync-chan true)
              local->remote
              (>! ops-chan {:local->remote local->remote})
              local->remote-full-sync
              (offer! private-full-sync-chan true)
              :else
              ;; if resume-state = nil, try a remote->local to sync recent diffs
              (offer! private-remote->local-sync-chan true))
            (put-sync-event! {:event :resume
                              :data  {:graph-uuid   graph-uuid
                                      :resume-state resume-state
                                      :epoch        (tc/to-epoch (t/now))}})
            (<! (.schedule this ::idle nil :resume)))

          (nil? result)
          (<! (.schedule this ::stop nil nil))

          :else
          (recur)))))

  (idle [this]
    (go
      (let [{:keys [stop remote->local local->remote local->remote-full-sync remote->local-full-sync pause resume] :as result}
            (<! ops-chan)]
        (cond
          (or stop (nil? result))
          (<! (.schedule this ::stop nil nil))
          remote->local
          (<! (.schedule this ::remote->local {:remote remote->local} {:remote-changed remote->local}))
          local->remote
          (<! (.schedule this ::local->remote {:local local->remote} {:local-changed local->remote}))
          local->remote-full-sync
          (<! (.schedule this ::local->remote-full-sync nil nil))
          remote->local-full-sync
          (<! (.schedule this ::remote->local-full-sync nil nil))
          pause
          (<! (.schedule this ::pause nil nil))
          resume
          (<! (.schedule this ::idle nil nil))
          :else
          (do
            (state/pub-event! [:capture-error {:error (js/Error. "sync/wrong-ops-chan-when-idle")
                                               :payload {:type :sync/wrong-ops-chan-when-idle
                                                         :ops-chan-result result
                                                         :user-id user-uuid
                                                         :graph-id graph-uuid}}])
            (<! (.schedule this ::idle nil nil)))))))

  (full-sync [this]
    (go
      (let [{:keys [succ need-sync-remote graph-has-been-deleted unknown stop] :as r}
            (<! (<sync-local->remote-all-files! local->remote-syncer))]
        (s/assert ::sync-local->remote-all-files!-result r)
        (cond
          succ
          (do
            (swap! *sync-state #(sync-state-reset-full-local->remote-files % []))
            (put-sync-event! {:event :finished-local->remote
                              :data  {:graph-uuid graph-uuid
                                      :full-sync? true
                                      :epoch      (tc/to-epoch (t/now))}})
            (.schedule this ::idle nil nil))
          need-sync-remote
          (do (util/drain-chan ops-chan)
              (>! ops-chan {:remote->local true})
              (>! ops-chan {:local->remote-full-sync true})
              (.schedule this ::idle nil nil))

          graph-has-been-deleted
          (.schedule this ::stop nil :graph-has-been-deleted)

          stop
          (.schedule this ::stop nil nil)
          unknown
          (do
            (state/pub-event! [:capture-error {:error unknown
                                               :payload {:type :sync/unknown
                                                         :event :local->remote-full-sync-failed
                                                         :user-id user-uuid
                                                         :graph-uuid graph-uuid}}])
            (put-sync-event! {:event :local->remote-full-sync-failed
                              :data  {:graph-uuid graph-uuid
                                      :epoch      (tc/to-epoch (t/now))}})
            (.schedule this ::idle nil nil))))))

  (remote->local-full-sync [this {:keys [retry-count]}]
    (go
      (let [{:keys [succ unknown stop pause]}
            (<! (<sync-remote->local-all-files! remote->local-syncer))]
        (cond
          succ
          (do (put-sync-event! {:event :finished-remote->local
                                :data  {:graph-uuid graph-uuid
                                        :full-sync? true
                                        :epoch      (tc/to-epoch (t/now))}})
              (.schedule this ::idle nil nil))
          stop
          (.schedule this ::stop nil nil)
          pause
          (do (resume-state--add-remote->local-full-sync-state graph-uuid)
              (.schedule this ::pause nil nil))
          unknown
          (do
            (state/pub-event! [:capture-error {:error unknown
                                               :payload {:event :remote->local-full-sync-failed
                                                         :type :sync/unknown
                                                         :graph-uuid graph-uuid
                                                         :user-id user-uuid}}])
            (put-sync-event! {:event :remote->local-full-sync-failed
                              :data  {:graph-uuid graph-uuid
                                      :exp        unknown
                                      :epoch      (tc/to-epoch (t/now))}})
            (let [next-state
                  (cond
                    (string/includes? (str (ex-cause unknown)) "404 Not Found")
                    ;; TODO: this should never happen
                    ::stop
                    (> retry-count 3)
                    ::stop

                    :else ;; if any other exception occurred, re-exec remote->local-full-sync
                    ::remote->local-full-sync)]
              (.schedule this next-state
                         (when (= ::remote->local-full-sync next-state) {:retry-count (inc retry-count)})
                         nil)))))))

  (remote->local [this _next-state {remote-val :remote}]
    (go
      (if (some-> remote-val :txid (<= @*txid))
        (.schedule this ::idle nil nil)
        (let [origin-txid @*txid
              {:keys [succ unknown stop pause need-remote->local-full-sync] :as r}
              (<! (<sync-remote->local! remote->local-syncer))]
          (s/assert ::sync-remote->local!-result r)
          (cond
            need-remote->local-full-sync
            (do (util/drain-chan ops-chan)
                (>! ops-chan {:remote->local-full-sync true})
                (>! ops-chan {:local->remote-full-sync true})
                (.schedule this ::idle nil nil))
            succ
            (do (put-sync-event! {:event :finished-remote->local
                                  :data  {:graph-uuid graph-uuid
                                          :full-sync? false
                                          :from-txid  origin-txid
                                          :to-txid    @*txid
                                          :epoch      (tc/to-epoch (t/now))}})
                (.schedule this ::idle nil nil))
            stop
            (.schedule this ::stop nil nil)
            pause
            (do (resume-state--add-remote->local-state graph-uuid)
                (.schedule this ::pause nil nil))
            unknown
            (do (prn "remote->local err" unknown)
                (state/pub-event! [:capture-error {:error unknown
                                                   :payload {:type :sync/unknown
                                                             :event :remote->local
                                                             :user-id user-uuid
                                                             :graph-uuid graph-uuid}}])
                (.schedule this ::idle nil nil)))))))

  (local->remote [this {local-changes :local}]
   ;; local-changes:: list of FileChangeEvent
    (assert (some? local-changes) local-changes)
    (go
      (let [distincted-local-changes (distinct-file-change-events local-changes)
            _ (swap! *sync-state #(sync-state-reset-full-local->remote-files % distincted-local-changes))
            change-events-partitions
            (sequence (partition-file-change-events upload-batch-size) distincted-local-changes)
            _ (put-sync-event! {:event :start
                                :data  {:type       :local->remote
                                        :graph-uuid graph-uuid
                                        :full-sync? false
                                        :epoch      (tc/to-epoch (t/now))}})
            {:keys [succ need-sync-remote graph-has-been-deleted unknown stop pause]}
            (loop [es-partitions change-events-partitions]
              (cond
                @*stopped?             {:stop true}
                @*paused?              {:pause true}
                (empty? es-partitions) {:succ true}
                :else
                (let [{:keys [succ need-sync-remote graph-has-been-deleted pause unknown stop] :as r}
                      (<! (<sync-local->remote! local->remote-syncer (first es-partitions)))]
                  (s/assert ::sync-local->remote!-result r)
                  (cond
                    succ
                    (recur (next es-partitions))
                    (or need-sync-remote graph-has-been-deleted unknown pause stop) r))))]
        (cond
          succ
          (do
            (swap! *sync-state #(sync-state-reset-full-local->remote-files % []))
            (put-sync-event! {:event :finished-local->remote
                              :data  {:graph-uuid         graph-uuid
                                      :full-sync?         false
                                      :file-change-events distincted-local-changes
                                      :epoch              (tc/to-epoch (t/now))}})
            (.schedule this ::idle nil nil))

          need-sync-remote
          (do (util/drain-chan ops-chan)
              (>! ops-chan {:remote->local true})
              (>! ops-chan {:local->remote local-changes})
              (.schedule this ::idle nil nil))

          graph-has-been-deleted
          (.schedule this ::stop nil :graph-has-been-deleted)

          stop
          (.schedule this ::stop nil nil)

          pause
          (do (resume-state--add-local->remote-state graph-uuid local-changes)
              (.schedule this ::pause nil nil))

          unknown
          (do
            (debug/pprint "local->remote" unknown)
            (state/pub-event! [:capture-error {:error unknown
                                               :payload {:event :local->remote
                                                         :type :sync/unknown
                                                         :user-id user-uuid
                                                         :graph-uuid graph-uuid}}])
            (.schedule this ::idle nil nil))))))
  IStoppable
  (-stop! [_]
    (go
      (when-not @*stopped?
        (vreset! *stopped? true)
        (ws-stop! *ws)
        (async/untap full-sync-mult private-full-sync-chan)
        (async/untap remote->local-sync-mult private-remote->local-sync-chan)
        (async/untap remote->local-full-sync-mult private-remote->local-full-sync-chan)
        (async/untap pause-resume-mult private-pause-resume-chan)
        (async/untap pubsub/app-wake-up-from-sleep-mult app-awake-from-sleep-chan)
        (when ops-chan (async/close! ops-chan))
        (stop-local->remote! local->remote-syncer)
        (stop-remote->local! remote->local-syncer)
        (<! (<rsapi-cancel-all-requests))
        (swap! *sync-state sync-state--update-state ::stop)
        (reset! current-sm-graph-uuid nil)
        (debug/pprint ["stop sync-manager, graph-uuid" graph-uuid "base-path" base-path]))))

  IStopped?
  (-stopped? [_]
    @*stopped?))

(defn sync-manager [user-uuid graph-uuid base-path repo txid *sync-state]
  (let [*txid (atom txid)
        *txid-for-get-deletion-log (atom txid)
        *stopped? (volatile! false)
        *paused? (volatile! false)
        remoteapi-with-stop (->RemoteAPI *stopped?)
        local->remote-syncer (->Local->RemoteSyncer user-uuid graph-uuid
                                                    base-path
                                                    repo *sync-state remoteapi-with-stop
                                                    (if (mobile-util/native-platform?)
                                                      2000
                                                      10000)
                                                    *txid *txid-for-get-deletion-log nil (chan) *stopped? *paused?
                                                    (chan 1) (chan 1))
        remote->local-syncer (->Remote->LocalSyncer user-uuid graph-uuid base-path
                                                    repo *txid *txid-for-get-deletion-log *sync-state remoteapi-with-stop
                                                    nil *stopped? *paused?)]
    (.set-remote->local-syncer! local->remote-syncer remote->local-syncer)
    (.set-local->remote-syncer! remote->local-syncer local->remote-syncer)
    (swap! *sync-state sync-state--update-current-syncing-graph-uuid graph-uuid)
    (->SyncManager user-uuid graph-uuid base-path *sync-state local->remote-syncer remote->local-syncer remoteapi-with-stop
                   nil *txid *txid-for-get-deletion-log nil nil nil *stopped? *paused? nil nil (chan 1) (chan 1) (chan 1) (chan 1))))

(defn sync-manager-singleton
  [user-uuid graph-uuid base-path repo txid *sync-state]
  (when-not @current-sm-graph-uuid
    (reset! current-sm-graph-uuid graph-uuid)
    (sync-manager user-uuid graph-uuid base-path repo txid *sync-state)))

;; Avoid sync reentrancy
(defonce *sync-entered? (atom false))

(defn <sync-stop []
  (go
    (when-let [sm ^SyncManager (state/get-file-sync-manager (state/get-current-file-sync-graph-uuid))]
      (println (str "[SyncManager " (:graph-uuid sm) "]") "stopping")

      (state/clear-file-sync-state! (:graph-uuid sm))

      (<! (-stop! sm))

      (reset! *sync-entered? false)

      (println (str "[SyncManager " (:graph-uuid sm) "]") "stopped"))

    (reset! current-sm-graph-uuid nil)))

(defn <sync-local->remote-now []
  (go
    (when-let [_sm ^SyncManager (state/get-file-sync-manager (state/get-current-file-sync-graph-uuid))]
      (offer! immediately-local->remote-chan true))))

(defn sync-need-password!
  []
  (when-let [sm ^SyncManager (state/get-file-sync-manager (state/get-current-file-sync-graph-uuid))]
    (.need-password sm)))

(defn check-graph-belong-to-current-user
  [current-user-uuid graph-user-uuid]
  (cond
    (nil? current-user-uuid)
    false

    (= current-user-uuid graph-user-uuid)
    true

    :else
    (do (notification/show! (t :file-sync/other-user-graph) :warning false)
        false)))

(defn <check-remote-graph-exists
  [local-graph-uuid]
  {:pre [(util/uuid-string? local-graph-uuid)]}
  (go
    (let [r (<! (<list-remote-graphs remoteapi))
          result
            (or
             ;; if api call failed, assume this remote graph still exists
             (instance? ExceptionInfo r)
             (and
              (contains? r :Graphs)
              (->> (:Graphs r)
                   (mapv :GraphUUID)
                   set
                   (#(contains? % local-graph-uuid)))))]

      (when-not result
        (notification/show! (t :file-sync/graph-deleted) :warning false))
      result)))

(defn sync-off?
  [sync-state]
  (or (nil? sync-state) (sync-state--stopped? sync-state)))

(defn graph-sync-off?
  "Is sync not running for this `graph-uuid`?"
  [graph-uuid]
  (sync-off? (state/get-file-sync-state graph-uuid)))

(defn graph-encrypted?
  []
  (when-let [graph-uuid (second @graphs-txid)]
    (get-pwd graph-uuid)))

(declare network-online-cursor)

(defn <sync-start
  []
  (when-not (false? (state/enable-sync?))
    (go
      (when (false? @*sync-entered?)
        (reset! *sync-entered? true)
        (let [*sync-state                 (atom (sync-state))
              current-user-uuid           (<! (user/<user-uuid))
              ;; put @graph-uuid & get-current-repo together,
              ;; prevent to get older repo dir and current graph-uuid.
              _                           (<! (p->c (persist-var/-load graphs-txid)))
              [user-uuid graph-uuid txid] @graphs-txid
              txid                        (or txid 0)
              repo                        (state/get-current-repo)]
          (when-not (instance? ExceptionInfo current-user-uuid)
            (when (and repo
                       @network-online-cursor
                       user-uuid graph-uuid txid
                       (graph-sync-off? graph-uuid)
                       (user/logged-in?)
                       (not (config/demo-graph? repo)))
              (try
                (when-let [sm (sync-manager-singleton current-user-uuid graph-uuid
                                                      (config/get-repo-dir repo) repo
                                                      txid *sync-state)]
                  (when (check-graph-belong-to-current-user current-user-uuid user-uuid)
                    (if-not (<! (<check-remote-graph-exists graph-uuid)) ; remote graph has been deleted
                      (clear-graphs-txid! repo)
                      (do
                        (state/set-file-sync-state graph-uuid @*sync-state)
                        (state/set-file-sync-manager graph-uuid sm)

                        ;; update global state when *sync-state changes
                        (add-watch *sync-state ::update-global-state
                                   (fn [_ _ _ n]
                                     (state/set-file-sync-state graph-uuid n)))

                        (state/set-state! [:file-sync/graph-state :current-graph-uuid] graph-uuid)

                        (.start sm)

                        (offer! remote->local-full-sync-chan true)
                        (offer! full-sync-chan true)))))
                (catch :default e
                  (prn "Sync start error: ")
                  (log/error :exception e)))))
          (reset! *sync-entered? false))))))

(defn- restart-if-stopped!
  [is-active?]
  (cond
    (and is-active? (graph-sync-off? (second @graphs-txid)))
    (<sync-start)

    :else
    (offer! pause-resume-chan is-active?)))

(def app-state-changed-cursor (rum/cursor state/state :mobile/app-state-change))

(def finished-local->remote-chan (chan 1))

(add-watch app-state-changed-cursor "sync"
           (fn [_ _ _ {:keys [is-active?]}]
             (cond
               (mobile-util/native-android?)
               (when-not is-active?
                 (<sync-local->remote-now))

               (mobile-util/native-ios?)
               (let [*task-id (atom nil)]
                 (if is-active?
                   (restart-if-stopped! is-active?)
                   (when (state/get-current-file-sync-graph-uuid)
                     (p/let [task-id (.beforeExit ^js BackgroundTask
                                                  (fn []
                                                    (go
                                                      ;; Wait for file watcher events
                                                      (<! (timeout 2000))
                                                      (util/drain-chan finished-local->remote-chan)
                                                      (<! (<sync-local->remote-now))
                                                      ;; wait at most 20s
                                                      (async/alts! [finished-local->remote-chan (timeout 20000)])
                                                      (p/let [active? (mobile-util/app-active?)]
                                                        (when-not active?
                                                          (offer! pause-resume-chan is-active?)))
                                                      (<! (timeout 5000))
                                                      (prn "finish task: " @*task-id)
                                                      (let [opt #js {:taskId @*task-id}]
                                                        (.finish ^js BackgroundTask opt)))))]
                       (reset! *task-id task-id)))))

               :else
               nil)))

;;; ### some add-watches

;; TODO: replace this logic by pause/resume state
(defonce network-online-cursor (rum/cursor state/state :network/online?))
(add-watch network-online-cursor "sync-manage"
           (fn [_k _r o n]
             (cond
               (and (true? o) (false? n))
               (<sync-stop)

               (and (false? o) (true? n))
               (<sync-start)

               :else
               nil)))

(defonce auth-id-token-cursor (rum/cursor state/state :auth/id-token))
(add-watch auth-id-token-cursor "sync-manage"
           (fn [_k _r _o n]
             (when (nil? n)
               (<sync-stop))))



;;; ### some sync events handler

;; re-exec remote->local-full-sync when it failed before
(def re-remote->local-full-sync-chan (chan 1))
(async/sub pubsub/sync-events-pub :remote->local-full-sync-failed re-remote->local-full-sync-chan)
(go-loop []
  (let [{{graph-uuid :graph-uuid} :data} (<! re-remote->local-full-sync-chan)
        {:keys [current-syncing-graph-uuid]}
        (state/get-file-sync-state graph-uuid)]
    (when (= graph-uuid current-syncing-graph-uuid)
      (offer! remote->local-full-sync-chan true))
    (recur)))

;; re-exec local->remote-full-sync when it failed
(def re-local->remote-full-sync-chan (chan 1))
(async/sub pubsub/sync-events-pub :local->remote-full-sync-failed re-local->remote-full-sync-chan)
(go-loop []
  (let [{{graph-uuid :graph-uuid} :data} (<! re-local->remote-full-sync-chan)
        {:keys [current-syncing-graph-uuid]} (state/get-file-sync-state graph-uuid)]
    (when (= graph-uuid current-syncing-graph-uuid)
      (offer! full-sync-chan true))
    (recur)))

;;; add-tap
(comment
 (def *x (atom nil))
 (add-tap (fn [v] (reset! *x v)))
 )
