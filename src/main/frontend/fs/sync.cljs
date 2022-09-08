(ns frontend.fs.sync
  (:require [cljs-http.client :as http]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs-time.coerce :as tc]
            [cljs.core.async :as async :refer [go timeout go-loop offer! poll! chan <! >!]]
            [cljs.core.async.impl.channels]
            [cljs.core.async.interop :refer [p->c]]
            [cljs.spec.alpha :as s]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.pprint :as pp]
            [electron.ipc :as ipc]
            [goog.string :as gstring]
            [frontend.config :as config]
            [frontend.debug :as debug]
            [frontend.handler.user :as user]
            [frontend.state :as state]
            [frontend.mobile.util :as mobile-util]
            [frontend.util :as util]
            [frontend.util.persist-var :as persist-var]
            [frontend.handler.notification :as notification]
            [frontend.context.i18n :refer [t]]
            [frontend.diff :as diff]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.encrypt :as encrypt]
            [medley.core :refer [dedupe-by]]
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
;; - every 20s, flush local changes, and sync to remote

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
                 ::stop
                 ::pause})
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
  (s/or :succ ::succ-map
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
                 :pause
                 :resume
                 :exception-decrypt-failed
                 :remote->local-full-sync-failed
                 :local->remote-full-sync-failed
                 })

(s/def ::sync-event (s/keys :req-un [::event ::data]))

;;; ### configs in config.edn
;; - :file-sync/ignore-files

(defn- get-ignored-files
  []
  (into #{#"logseq/graphs-txid.edn$"
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
(def graphs-txid (persist-var/persist-var nil "graphs-txid"))

(declare assert-local-txid<=remote-txid)
(defn update-graphs-txid!
  [latest-txid graph-uuid user-uuid repo]
  {:pre [(int? latest-txid) (>= latest-txid 0)]}
  (persist-var/-reset-value! graphs-txid [user-uuid graph-uuid latest-txid] repo)
  (some-> (persist-var/persist-save graphs-txid)
          p->c)
  (when (state/developer-mode?) (assert-local-txid<=remote-txid)))

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
              (<! (timeout 30000))
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

(def *on-flying-request
  "requests not finished"
  (atom #{}))

(def stoppable-apis #{"get_all_files"})

(defn- <request*
  "max retry count is 5.
  *stop: volatile var, stop retry-request when it's true,
          and return :stop"
  ([api-name body token refresh-token-fn *stop] (<request* api-name body token refresh-token-fn 0 *stop))
  ([api-name body token refresh-token-fn retry-count *stop]
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
                 (let [token (<! (refresh-token-fn))]
                   (<! (<request* api-name body token refresh-token-fn (inc retry-count) *stop)))))
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
      (string/join "/" (drop 2 parts))
      path)))

(defprotocol IRelativePath
  (-relative-path [this]))

(defn relative-path [o]
  (cond
    (implements? IRelativePath o)
    (-relative-path o)

    (string? o)
    (remove-user-graph-uuid-prefix o)

    :else
    (throw (js/Error. (str "unsupport type " (str o))))))

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

(defn- diffs->partitioned-filetxns
  "transducer.
  1. diff -> `FileTxn` , see also `<get-diff`
  2. distinct redundant update type filetxns
  3. partition filetxns, each partition contains same type filetxns,
     for update type, at most N items in each partition
     for delete & rename type, only 1 item in each partition.
  4. remove update or rename filetxns if they are deleted in later filetxns.
  NOTE: this xf should apply on reversed diffs sequence (sort by txid)"
  [n]
  (comp
   (map diff->filetxns)
   cat
   (remove ignored?)
   distinct-update-filetxns-xf
   remove-deleted-filetxns-xf
   (partition-filetxns n)))

(defn- filepath+checksum->diff
  [index {:keys [relative-path checksum user-uuid graph-uuid]}]
  {:post [(s/valid? ::diff %)]}
  {:TXId (inc index)
   :TXType "update_files"
   :TXContent [[(string/join "/" [user-uuid graph-uuid relative-path]) nil checksum]]})

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


(deftype FileMetadata [size etag path encrypted-path last-modified remote? ^:mutable normalized-path]
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
      not-found))


  IPrintWithWriter
  (-pr-writer [_ w _opts]
    (write-all w (str {:size size :etag etag :path path :remote? remote? :last-modified last-modified}))))



(def ^:private higher-priority-remote-files
  "when diff all remote files and local files, following remote files always need to download(when checksum not matched),
  even local-file's last-modified > remote-file's last-modified.
  because these files will be auto created when the graph created, we dont want them to re-write related remote files."
  #{"logseq/config.edn" "logseq/custom.css"
    "pages/contents.md" "pages/contents.org"
    "logseq/metadata.edn"})

;; TODO: use fn some to filter FileMetadata here, it cause too much loop
(defn diff-file-metadata-sets
  "Find the `FileMetadata`s that exists in s1 and does not exist in s2,
  compare by path+checksum+last-modified,
  if s1.path = s2.path & s1.checksum <> s2.checksum & s1.last-modified > s2.last-modified
  (except some default created files),
  keep this `FileMetadata` in result"
  [s1 s2]
  (reduce
   (fn [result item]
     (let [path (:path item)
           encrypted-path (:encrypted-path item)
           checksum (:etag item)
           last-modified (:last-modified item)]
       (if (some
            #(cond
               (not= encrypted-path (:encrypted-path %))
               false
               (= checksum (:etag %))
               true
               (>= last-modified (:last-modified %))
               false
               ;; these special files have higher priority in s1
               (contains? higher-priority-remote-files path)
               false
               (< last-modified (:last-modified %))
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




(defn- sort-file-metatdata-fn
  ":recent-days-range > :favorite-pages > small-size pages > ...
  :recent-days-range : [<min-inst-ms> <max-inst-ms>]
"
  [& {:keys [recent-days-range favorite-pages]}]
  {:pre [(or (nil? recent-days-range)
             (every? number? recent-days-range))]}
  (let [favorite-pages* (set favorite-pages)]
    (fn [^FileMetadata item]
      (let [path (relative-path item)
            journal? (string/starts-with? path "journals/")
            journal-day
            (when journal?
              (try
                (tc/to-long
                 (tf/parse (tf/formatter "yyyy_MM_dd")
                           (-> path
                               (string/replace-first "journals/" "")
                               (string/replace-first ".md" ""))))
                (catch :default _)))]
        (cond
          (and recent-days-range
               journal-day
               (<= (first recent-days-range)
                   ^number journal-day
                   (second recent-days-range)))
          journal-day

          (contains? favorite-pages* path)
          (count path)

          :else
          (- (.-size item)))))))
;;; ### APIs
;; `RSAPI` call apis through rsapi package, supports operations on files

(defprotocol IRSAPI
  (rsapi-ready? [this graph-uuid] "return true when rsapi ready")
  (<key-gen [this] "generate public+private keys")
  (<set-env [this prod? private-key public-key graph-uuid] "set environment")
  (<get-local-files-meta [this graph-uuid base-path filepaths] "get local files' metadata")
  (<get-local-all-files-meta [this graph-uuid base-path] "get all local files' metadata")
  (<rename-local-file [this graph-uuid base-path from to])
  (<update-local-files [this graph-uuid base-path filepaths] "remote -> local")
  (<download-version-files [this graph-uuid base-path filepaths])
  (<delete-local-files [this graph-uuid base-path filepaths])
  (<update-remote-files [this graph-uuid base-path filepaths local-txid] "local -> remote, return err or txid")
  (<delete-remote-files [this graph-uuid base-path filepaths local-txid] "return err or txid")
  (<encrypt-fnames [this fnames])
  (<decrypt-fnames [this fnames]))

(defprotocol IRemoteAPI
  (<user-info [this] "user info")
  (<get-remote-all-files-meta [this graph-uuid] "get all remote files' metadata")
  (<get-remote-files-meta [this graph-uuid filepaths] "get remote files' metadata")
  (<get-remote-graph [this graph-name-opt graph-uuid-opt] "get graph info by GRAPH-NAME-OPT or GRAPH-UUID-OPT")
  (<get-remote-file-versions [this graph-uuid filepath] "get file's version list")
  (<list-remote-graphs [this] "list all remote graphs")
  (<get-diff [this graph-uuid from-txid] "get diff from FROM-TXID, return [txns, latest-txid, min-txid]")
  (<create-graph [this graph-name] "create graph")
  (<delete-graph [this graph-uuid] "delete graph")
  (<get-graph-salt [this graph-uuid] "return httpcode 410 when salt expired")
  (<create-graph-salt [this graph-uuid] "return httpcode 409 when salt already exists and not expired yet")
  (<get-graph-encrypt-keys [this graph-uuid])
  (<upload-graph-encrypt-keys [this graph-uuid public-key encrypted-private-key]))

(defprotocol IToken
  (<get-token [this])
  (<refresh-token [this]))


(defn <case-different-local-file-exist?
  "e.g. filepath=\"pages/Foo.md\"
  found-filepath=\"pages/foo.md\"
  it happens on macos (case-insensitive fs)

  return canonicalized filepath if exists"
  [irsapi base-path filepath]
  (go
    (let [r (<! (<get-local-files-meta irsapi "" base-path [filepath]))]
      (when (some-> r first :path (not= filepath))
        (-> r first :path)))))


(defn <local-file-not-exist?
  [irsapi base-path filepath]
  (go
    (let [r (<! (<get-local-files-meta irsapi "" base-path [filepath]))]

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
      (if (and (instance? ExceptionInfo r)
               (string/index-of (str (ex-cause r)) "operation timed out")
               (> n 0))
        (do
          (print (str "retry(" n ") ..."))
          (recur (dec n)))
        r))))

(deftype RSAPI [^:mutable _graph-uuid ^:mutable _private-key ^:mutable _public-key]
  IToken
  (<get-token [this]
    (go
      (or (state/get-auth-id-token)
          (<! (<refresh-token this)))))
  (<refresh-token [_]
    (go
      (<! (user/<refresh-id-token&access-token))
      (state/get-auth-id-token)))

  IRSAPI
  (rsapi-ready? [_ graph-uuid] (and (= graph-uuid _graph-uuid) _private-key _public-key))
  (<key-gen [_] (go (js->clj (<! (p->c (ipc/ipc "key-gen")))
                             :keywordize-keys true)))
  (<set-env [_ prod? private-key public-key graph-uuid]
    (when (not-empty private-key)
      (print (util/format "[%s] setting sync age-encryption passphrase..." graph-uuid)))
    (set! _graph-uuid graph-uuid)
    (set! _private-key private-key)
    (set! _public-key public-key)
    (p->c (ipc/ipc "set-env" (if prod? "prod" "dev") private-key public-key)))
  (<get-local-all-files-meta [_ graph-uuid base-path]
    (go
      (let [r (<! (<retry-rsapi #(p->c (ipc/ipc "get-local-all-files-meta" graph-uuid base-path))))]
        (if (instance? ExceptionInfo r)
          r
          (->> r
               js->clj
               (map (fn [[path metadata]]
                      (->FileMetadata (get metadata "size") (get metadata "md5") path
                                      (get metadata "encryptedFname") (get metadata "mtime") false nil)))
               set)))))
  (<get-local-files-meta [_ graph-uuid base-path filepaths]
    (go
      (let [r (<! (<retry-rsapi #(p->c (ipc/ipc "get-local-files-meta" graph-uuid base-path filepaths))))]
        (assert (not (instance? ExceptionInfo r)) "get-local-files-meta shouldn't return exception")
        (->> r
             js->clj
             (map (fn [[path metadata]]
                    (->FileMetadata (get metadata "size") (get metadata "md5") path
                                    (get metadata "encryptedFname") (get metadata "mtime") false nil)))))))
  (<rename-local-file [_ graph-uuid base-path from to]
    (<retry-rsapi #(p->c (ipc/ipc "rename-local-file" graph-uuid base-path from to))))
  (<update-local-files [this graph-uuid base-path filepaths]
    (println "update-local-files" graph-uuid base-path filepaths)
    (go
      (let [token (<! (<get-token this))
            r (<! (<retry-rsapi
                   #(p->c (ipc/ipc "update-local-files" graph-uuid base-path filepaths token))))]
        r)))
  (<download-version-files [this graph-uuid base-path filepaths]
    (go
      (let [token (<! (<get-token this))
            r (<! (<retry-rsapi
                   #(p->c (ipc/ipc "download-version-files" graph-uuid base-path filepaths token))))]
        r)))

  (<delete-local-files [_ graph-uuid base-path filepaths]
    (go
      (println "delete-local-files" filepaths)
      (let [r (<! (<retry-rsapi #(p->c (ipc/ipc "delete-local-files" graph-uuid base-path filepaths))))]
        r)))

  (<update-remote-files [this graph-uuid base-path filepaths local-txid]
    (go
      (let [token (<! (<get-token this))]
        (<! (<retry-rsapi
             #(p->c (ipc/ipc "update-remote-files" graph-uuid base-path filepaths local-txid token)))))))

  (<delete-remote-files [this graph-uuid base-path filepaths local-txid]
    (go
      (let [token (<! (<get-token this))]
        (<!
         (<retry-rsapi
          #(p->c (ipc/ipc "delete-remote-files" graph-uuid base-path filepaths local-txid token)))))))
  (<encrypt-fnames [_ fnames] (go (js->clj (<! (p->c (ipc/ipc "encrypt-fnames" fnames))))))
  (<decrypt-fnames [_ fnames] (go
                                (let [r (<! (p->c (ipc/ipc "decrypt-fnames" fnames)))]
                                  (if (instance? ExceptionInfo r)
                                    (ex-info "decrypt-failed" {:fnames fnames} (ex-cause r))
                                    (js->clj r))))))


(deftype ^:large-vars/cleanup-todo CapacitorAPI [^:mutable _graph-uuid ^:mutable _private-key ^:mutable _public-key]
  IToken
  (<get-token [this]
    (go
      (or (state/get-auth-id-token)
          (<! (<refresh-token this)))))
  (<refresh-token [_]
    (go
      (<! (user/<refresh-id-token&access-token))
      (state/get-auth-id-token)))

  IRSAPI
  (rsapi-ready? [_ graph-uuid] (and (= graph-uuid _graph-uuid) _private-key _public-key))
  (<key-gen [_]
    (go (let [r (<! (p->c (.keygen mobile-util/file-sync #js {})))]
          (-> r
              (js->clj :keywordize-keys true)))))
  (<set-env [_ prod? secret-key public-key graph-uuid]
    (set! _graph-uuid graph-uuid)
    (set! _private-key secret-key)
    (set! _public-key public-key)
    (p->c (.setEnv mobile-util/file-sync (clj->js {:env (if prod? "prod" "dev")
                                                   :secretKey secret-key
                                                   :publicKey public-key}))))

  (<get-local-all-files-meta [_ _graph-uuid base-path]
    (go
      (let [r (<! (p->c (.getLocalAllFilesMeta mobile-util/file-sync (clj->js {:basePath base-path}))))]
        (if (instance? ExceptionInfo r)
          r
          (->> (.-result r)
               js->clj
               (map (fn [[path metadata]]
                      (->FileMetadata (get metadata "size") (get metadata "md5") path
                                      (get metadata "encryptedFname") (get metadata "mtime") false nil)))
               set)))))

  (<get-local-files-meta [_ _graph-uuid base-path filepaths]
    (go
      (let [r (<! (p->c (.getLocalFilesMeta mobile-util/file-sync
                                            (clj->js {:basePath base-path
                                                      :filePaths filepaths}))))]
        (assert (not (instance? ExceptionInfo r)) "get-local-files-meta shouldn't return exception")
        (->> (.-result r)
             js->clj
             (map (fn [[path metadata]]
                    (->FileMetadata (get metadata "size") (get metadata "md5") path
                                    (get metadata "encryptedFname") (get metadata "mtime") false nil)))
             set))))

  (<rename-local-file [_ _graph-uuid base-path from to]
    (p->c (.renameLocalFile mobile-util/file-sync
                            (clj->js {:basePath base-path
                                      :from from
                                      :to to}))))

  (<update-local-files [this graph-uuid base-path filepaths]
    (go
      (let [token (<! (<get-token this))
            r (<! (<retry-rsapi
                   #(p->c (.updateLocalFiles mobile-util/file-sync (clj->js {:graphUUID graph-uuid
                                                                             :basePath base-path
                                                                             :filePaths filepaths
                                                                             :token token})))))]
        r)))

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

  (<delete-local-files [_ _graph-uuid base-path filepaths]
    (go
      (let [r (<! (<retry-rsapi #(p->c (.deleteLocalFiles mobile-util/file-sync
                                                          (clj->js {:basePath base-path
                                                                    :filePaths filepaths})))))]
        r)))

  (<update-remote-files [this graph-uuid base-path filepaths local-txid]
    (go
      (let [token (<! (<get-token this))
            r (<! (p->c (.updateRemoteFiles mobile-util/file-sync
                                            (clj->js {:graphUUID graph-uuid
                                                      :basePath base-path
                                                      :filePaths filepaths
                                                      :txid local-txid
                                                      :token token
                                                      :fnameEncryption true}))))]
        (if (instance? ExceptionInfo r)
          r
          (get (js->clj r) "txid")))))

  (<delete-remote-files [this graph-uuid _base-path filepaths local-txid]
    (go
     (let [token (<! (<get-token this))
           r (<! (p->c (.deleteRemoteFiles mobile-util/file-sync
                                           (clj->js {:graphUUID graph-uuid
                                                     :filePaths filepaths
                                                     :txid local-txid
                                                     :token token}))))]
       (if (instance? ExceptionInfo r)
         r
         (get (js->clj r) "txid")))))

  (<encrypt-fnames [_ fnames]
    (go
      (let [r (<! (p->c (.encryptFnames mobile-util/file-sync
                                        (clj->js {:filePaths fnames}))))]
        (if (instance? ExceptionInfo r)
          (.-cause r)
          (get (js->clj r) "value")))))
  (<decrypt-fnames [_ fnames]
    (go (let [r (<! (p->c (.decryptFnames mobile-util/file-sync
                                          (clj->js {:filePaths fnames}))))]
          (if (instance? ExceptionInfo r)
            (ex-info "decrypt-failed" {:fnames fnames} (ex-cause r))
            (get (js->clj r) "value"))))))

(def rsapi (cond
             (util/electron?)
             (->RSAPI nil nil nil)

             (mobile-util/native-ios?)
             (->CapacitorAPI nil nil nil)

             (mobile-util/native-android?)
             (->CapacitorAPI nil nil nil)

             :else
             nil))

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

;; "`SyncManager` will put some internal sync events to this chan.
;;   see also spec `::sync-event`"
(defonce ^:private sync-events-chan
  (chan (async/sliding-buffer 1000)))
;; see also spec `::event` for topic list
(defonce sync-events-publication
  (async/pub sync-events-chan :event))

(defn- put-sync-event!
  [val]
  {:pre [(s/valid? ::sync-event val)]}
  (async/put! sync-events-chan val))

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
       (async/sub sync-events-publication topic ch)
       (async/admix out-mix ch))
     (go-loop []
       (let [{:keys [val stop]}
             (async/alt!
               debug-print-sync-events-loop-stop-chan {:stop true}
               out-ch ([v] {:val v}))]
         (cond
           stop (do (async/unmix-all out-mix)
                    (doseq [[topic ch] topic&chs]
                      (async/unsub sync-events-publication topic ch)))

           val (do (pp/pprint [:debug :sync-event val])
                   (recur))))))))


(defn stop-debug-print-sync-events-loop
  []
  (offer! debug-print-sync-events-loop-stop-chan true))


(comment
  ;; sub one type event example:
  (def c1 (chan 10))
  (async/sub sync-events-publication :created-local-version-file c1)
  (offer! sync-events-chan {:event :created-local-version-file :data :xxx})
  (poll! c1)

  ;; sub multiple type events example:
  ;; sub :created-local-version-file and :finished-remote->local events,
  ;; output into channel c4-out
  (def c2 (chan 10))
  (def c3 (chan 10))
  (def c4-out (chan 10))
  (def mix-out (async/mix c4-out))
  (async/admix mix-out c2)
  (async/admix mix-out c3)
  (async/sub sync-events-publication :created-local-version-file c2)
  (async/sub sync-events-publication :finished-remote->local c3)
  (offer! sync-events-chan {:event :created-local-version-file :data :xxx})
  (offer! sync-events-chan {:event :finished-remote->local :data :xxx})
  (poll! c4-out)
  (poll! c4-out)
  )

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
      (let [resp (<! (<request api-name body (<! (<get-token this)) #(<refresh-token this) *stopped?))]
        (if (http/unexceptional-status? (:status resp))
          (get-resp-json-body resp)
          (let [exp (ex-info "request failed"
                             {:err          resp
                              :body         (get-resp-json-body resp)
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
  (<get-token [this]
    (go
      (or (state/get-auth-id-token)
          (<! (<refresh-token this)))))

  (<refresh-token [_]
    (go
      (<! (user/<refresh-id-token&access-token))
      (state/get-auth-id-token))))

(extend-type RemoteAPI
  IRemoteAPI
  (<user-info [this] (.<request this "user_info" {}))
  (<get-remote-all-files-meta [this graph-uuid]
    (go
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
                                        :last-modified (:LastModified %))
                             objs))
                     (when-not (empty? next-continuation-token)
                       (recur next-continuation-token)))))))]
        (if (instance? ExceptionInfo exp-r)
          exp-r
          (let [file-meta-list*          (persistent! file-meta-list)
                encrypted-path-list*     (persistent! encrypted-path-list)
                path-list-or-exp (<! (<decrypt-fnames rsapi encrypted-path-list*))]
            (if (instance? ExceptionInfo path-list-or-exp)
              path-list-or-exp
              (let [encrypted-path->path-map (zipmap encrypted-path-list* path-list-or-exp)]
                (set
                 (mapv
                  #(->FileMetadata nil
                                   (:checksum %)
                                   (get encrypted-path->path-map (:encrypted-path %))
                                   (:encrypted-path %)
                                   (:last-modified %)
                                   true nil)
                  file-meta-list*)))))))))

  (<get-remote-files-meta [this graph-uuid filepaths]
    {:pre [(coll? filepaths)]}
    (go
      (let [encrypted-paths* (<! (<encrypt-fnames rsapi filepaths))
            r                (<! (.<request this "get_files_meta" {:GraphUUID graph-uuid :Files encrypted-paths*}))]
        (if (instance? ExceptionInfo r)
          r
          (let [encrypted-paths (mapv :FilePath r)
                paths-or-exp    (<! (<decrypt-fnames rsapi encrypted-paths))]
            (if (instance? ExceptionInfo paths-or-exp)
              paths-or-exp
              (let [encrypted-path->path-map (zipmap encrypted-paths paths-or-exp)]
                (into #{}
                      (map #(->FileMetadata (:Size %)
                                            (:Checksum %)
                                            (get encrypted-path->path-map (:FilePath %))
                                            (:FilePath %)
                                            (:LastModified %)
                                            true nil))
                      r))))))))

  (<get-remote-graph [this graph-name-opt graph-uuid-opt]
    {:pre [(or graph-name-opt graph-uuid-opt)]}
    (.<request this "get_graph" (cond-> {}
                                  (seq graph-name-opt)
                                  (assoc :GraphName graph-name-opt)
                                  (seq graph-uuid-opt)
                                  (assoc :GraphUUID graph-uuid-opt))))

  (<get-remote-file-versions [this graph-uuid filepath]
    (go
      (let [encrypted-path (first (<! (<encrypt-fnames rsapi [filepath])))]
        (<! (.<request this "get_file_version_list" {:GraphUUID graph-uuid :File encrypted-path})))))

  (<list-remote-graphs [this]
    (.<request this "list_graphs"))

  (<get-diff [this graph-uuid from-txid]
    ;; TODO: path in transactions should be relative path(now s3 key, which includes graph-uuid and user-uuid)
    (go
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
                 (<! (<decrypt-fnames rsapi encrypted-paths)))
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
    (.<request this "create_graph" {:GraphName graph-name}))

  (<delete-graph [this graph-uuid]
    (.<request this "delete_graph" {:GraphUUID graph-uuid}))

  (<get-graph-salt [this graph-uuid]
    (.<request this "get_graph_salt" {:GraphUUID graph-uuid}))

  (<create-graph-salt [this graph-uuid]
    (.<request this "create_graph_salt" {:GraphUUID graph-uuid}))

  (<get-graph-encrypt-keys [this graph-uuid]
    (.<request this "get_graph_encrypt_keys" {:GraphUUID graph-uuid}))

  (<upload-graph-encrypt-keys [this graph-uuid public-key encrypted-private-key]
    (.<request this "upload_graph_encrypt_keys" {:GraphUUID             graph-uuid
                                                 :public-key            public-key
                                                 :encrypted-private-key encrypted-private-key})))


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

(defn add-new-version-file
  [repo path content]
  ;; TODO @leizhe mobile implementation
  (ipc/ipc "addVersionFile" (config/get-local-dir repo) path content))

(defn- is-journals-or-pages?
  [filetxn]
  (let [rel-path (relative-path filetxn)]
    (or (string/starts-with? rel-path "journals/")
        (string/starts-with? rel-path "pages/"))))

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
      (let [path (relative-path filetxn)
            repo (state/get-current-repo)
            file-path (config/get-file-path repo path)
            content (<! (p->c (fs/read-file "" file-path)))]
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
    (go (let [remote-txid (:TXId (<! (<get-remote-graph remoteapi nil (second @graphs-txid))))]
          (assert (<= local-txid remote-txid)
                  [@graphs-txid local-txid remote-txid])))))

(defn- get-local-files-checksum
  [base-path relative-paths]
  (go
    (into {}
          (map (juxt #(.-path ^FileMetadata %) #(.-etag ^FileMetadata %)))
          (<! (<get-local-files-meta rsapi "" base-path relative-paths)))))

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
                                         [% (db/get-file repo (config/get-file-path repo (relative-path %)))]))
                                     (remove nil?))]

        (doseq [relative-p (map relative-path filetxns)]
          (when-some [relative-p* (<! (<case-different-local-file-exist? rsapi base-path relative-p))]
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

        (let [update-local-files-ch (<update-local-files rsapi graph-uuid base-path (map relative-path filetxns))
              r (<! (<with-pause update-local-files-ch *paused))]
          (doseq [[filetxn origin-db-content] txn->db-content-vec]
            (when (<! (need-add-version-file? filetxn origin-db-content))
              (add-new-version-file repo (relative-path filetxn) origin-db-content)
              (put-sync-event! {:event :created-local-version-file
                                :data {:graph-uuid graph-uuid
                                       :repo repo
                                       :path (relative-path filetxn)
                                       :epoch (tc/to-epoch (t/now))}})))
          r))

      (.-deleted? (first filetxns))
      (let [filetxn (first filetxns)]
        (assert (= 1 (count filetxns)))
        (if (<! (<local-file-not-exist? rsapi base-path (relative-path filetxn)))
          ;; not exist, ignore
          true
          (let [r (<! (<delete-local-files rsapi graph-uuid base-path [(relative-path filetxn)]))]
            (if (and (instance? ExceptionInfo r)
                     (string/index-of (str (ex-cause r)) "No such file or directory"))
              true
              r)))))))

(defn apply-filetxns-partitions
  "won't call update-graphs-txid! when *txid is nil"
  [*sync-state user-uuid graph-uuid base-path filetxns-partitions repo *txid *stopped *paused]
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
            (let [latest-txid (apply max (map #(.-txid ^FileTxn %) filetxns))]
              ;; update local-txid
              (when *txid
                (reset! *txid latest-txid)
                (update-graphs-txid! latest-txid graph-uuid user-uuid repo))
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

  IPrintWithWriter
  (-pr-writer [_ w _opts]
    (write-all w (str {:type type :base-path dir :path path :size (:size stat) :checksum checksum}))))


(defn- <file-change-event=>recent-remote->local-file-item
  [^FileChangeEvent e]
  (go
    (let [tp (case (.-type e)
               ("add" "change") :update
               "unlink" :delete)
          path (relative-path e)]
      {:remote->local-type tp
       :checksum (if (= tp :delete) nil
                     (val (first (<! (get-local-files-checksum (.-dir e) [path])))))
       :path path})))

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

(defonce local-changes-chan (chan (async/dropping-buffer 1000)))
(defn file-watch-handler
  "file-watcher callback"
  [type {:keys [dir path _content stat] :as _payload}]
  (when-let [current-graph (state/get-current-repo)]
    (when (string/ends-with? current-graph dir)
      (let [sync-state (state/get-file-sync-state current-graph)]
        (when (and sync-state (not (sync-state--stopped? sync-state)))
          (when (or (:mtime stat) (= type "unlink"))
            (go
              (let [path (remove-dir-prefix dir path)
                    files-meta (and (not= "unlink" type)
                                    (<! (<get-local-files-meta rsapi "" dir [path])))
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
                                      {:mtime (tc/to-long (t/now))} "fake-checksum"))
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
    (let [encrypted-pwd (js/localStorage.getItem (local-storage-pwd-path graph-uuid))]
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
                                :after-input-password #(go (<! (restore-pwd! graph-uuid))
                                                           (offer! <restored-pwd {:graph-uuid graph-uuid :value true}))}])
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
                        (notification/show! "Password successfully matched" :success)
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
    (<set-env rsapi prod? private-key public-key graph-uuid)))

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

(def stop-sync-chan
  "offer `true` to this chan will stop current `SyncManager`"
  (chan 1))
(def stop-sync-mult (async/mult stop-sync-chan))

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
(def app-state-changed-cursor (rum/cursor state/state :mobile/app-state-change))
(add-watch app-state-changed-cursor "sync"
           (fn [_ _ _ {:keys [is-active?]}]
             (offer! pause-resume-chan is-active?)))

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
   :current-local->remote-files #{}
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

(defrecord Remote->LocalSyncer [user-uuid graph-uuid base-path repo *txid *sync-state remoteapi
                                ^:mutable local->remote-syncer *stopped *paused]
  Object
  (set-local->remote-syncer! [_ s] (set! local->remote-syncer s))
  (sync-files-remote->local!
    [_ relative-filepath+checksum-coll latest-txid]
    (go
      (let [partitioned-filetxns
            (sequence (filepath+checksum-coll->partitioned-filetxns
                       10 graph-uuid user-uuid)
                      relative-filepath+checksum-coll)
            r
            (if (empty? (flatten partitioned-filetxns))
              {:succ true}
              (<! (apply-filetxns-partitions
                   *sync-state user-uuid graph-uuid base-path partitioned-filetxns repo
                   nil *stopped *paused)))]
        (cond
          (instance? ExceptionInfo r) {:unknown r}
          @*stopped                   {:stop true}
          @*paused                    {:pause true}
          :else
          (do (update-graphs-txid! latest-txid graph-uuid user-uuid repo)
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
                      (let [partitioned-filetxns (transduce (diffs->partitioned-filetxns 10)
                                                            (completing (fn [r i] (conj r (reverse i)))) ;reverse
                                                            '()
                                                            (reverse diff-txns))]
                        (if (empty? (flatten partitioned-filetxns))
                          (do (update-graphs-txid! latest-txid graph-uuid user-uuid repo)
                              (reset! *txid latest-txid)
                              {:succ true})
                          (<! (apply-filetxns-partitions
                               *sync-state user-uuid graph-uuid base-path
                               partitioned-filetxns repo *txid *stopped *paused)))))))))]
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
                                :data {:graph-uuid graph-uuid
                                       :exp remote-all-files-meta-or-exp
                                       :epoch (tc/to-epoch (t/now))}})
              {:stop true})
          (let [remote-all-files-meta remote-all-files-meta-or-exp
                local-all-files-meta  (<! local-all-files-meta-c)
                diff-remote-files     (diff-file-metadata-sets remote-all-files-meta local-all-files-meta)
                recent-10-days-range  ((juxt #(tc/to-long (t/minus % (t/days 10))) #(tc/to-long %)) (t/today))
                sorted-diff-remote-files
                (sort-by
                 (sort-file-metatdata-fn :recent-days-range recent-10-days-range) > diff-remote-files)
                latest-txid           (:TXId (<! (<get-remote-graph remoteapi nil graph-uuid)))]
            (println "[full-sync(remote->local)]" (count sorted-diff-remote-files) "files need to sync")
            (<! (.sync-files-remote->local!
                 this (map (juxt relative-path -checksum)
                           sorted-diff-remote-files)
                 latest-txid))))))))

(defn- <file-changed?
  "return true when file changed compared with remote"
  [graph-uuid file-path-without-base-path base-path]
  {:pre [(string? file-path-without-base-path)]}
  (go
    (let [remote-meta (first (<! (<get-remote-files-meta remoteapi graph-uuid [file-path-without-base-path])))
          local-meta (first (<! (<get-local-files-meta rsapi graph-uuid base-path [file-path-without-base-path])))]
      (not= remote-meta local-meta))))

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
        (<! (<local-file-not-exist? rsapi basepath r-path))

        ("add" "change")
        ;; 1. local file exists
        ;; 2. compare with remote file, and changed
        (and (not (<! (<local-file-not-exist? rsapi basepath r-path)))
             (<! (<file-changed? graph-uuid r-path basepath)))))))

(defn- <filter-checksum-not-consistent
  "filter out FileChangeEvents checksum changed,
  compare checksum in FileChangeEvent and checksum calculated now"
  [es]
  {:pre [(or (nil? es) (coll? es))
         (every? #(instance? FileChangeEvent %) es)]}
  (go
    (when (seq es)
      (if (= "unlink" (.-type ^FileChangeEvent (first es)))
        es
        (let [base-path            (.-dir (first es))
              files-meta           (<! (<get-local-files-meta rsapi "" base-path (mapv relative-path es)))
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


(defrecord ^:large-vars/cleanup-todo
    Local->RemoteSyncer [user-uuid graph-uuid base-path repo *sync-state remoteapi
                         ^:mutable rate *txid ^:mutable remote->local-syncer stop-chan *stopped *paused
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
                 (not (ignored? e)) ;not ignored
                 ;; download files will also trigger file-change-events, ignore them
                 (let [r (not (contains? (:recent-remote->local-files @*sync-state)
                                         (<! (<file-change-event=>recent-remote->local-file-item e))))]
                   (when (and (true? r)
                              (seq (:recent-remote->local-files @*sync-state)))
                     (println :debug (:recent-remote->local-files @*sync-state) e))
                   r)))))

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
        (let [type          (.-type ^FileChangeEvent (first es))
              es->paths-xf  (comp
                             (map #(relative-path %))
                             (remove ignored?))]
          (go
            (let [es*   (<! (<filter-checksum-not-consistent es))
                  _     (when (not= (count es*) (count es))
                          (println :debug :filter-checksum-changed
                                   (mapv relative-path (set/difference (set es) (set es*)))))
                  es**  (filter-too-huge-files es*)
                  _     (when (not= (count es**) (count es*))
                          (println :debug :filter-too-huge-files
                                   (mapv relative-path (set/difference (set es*) (set es**)))))
                  paths (sequence es->paths-xf es**)
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
                (let [remote-txid (:TXId (<! (<get-remote-graph remoteapi nil graph-uuid)))]
                  (update-graphs-txid! remote-txid graph-uuid user-uuid repo)
                  (reset! *txid remote-txid)
                  {:succ true})

                (graph-has-been-deleted? r*)
                (do (println :graph-has-been-deleted r*)
                    {:graph-has-been-deleted true})

                paused?
                {:pause true}

                succ?                   ; succ
                (do
                  (println "sync-local->remote! update txid" r*)
                  ;; persist txid
                  (update-graphs-txid! r* graph-uuid user-uuid repo)
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
              remote-all-files-meta-or-exp (<! remote-all-files-meta-c)]
          (if (or (storage-exceed-limit? remote-all-files-meta-or-exp)
                  (sync-stop-when-api-flying? remote-all-files-meta-or-exp)
                  (decrypt-exp? remote-all-files-meta-or-exp))
            (do (put-sync-event! {:event :exception-decrypt-failed
                                  :data  {:graph-uuid graph-uuid
                                          :exp        remote-all-files-meta-or-exp
                                          :epoch      (tc/to-epoch (t/now))}})
                {:stop true})
            (let [remote-all-files-meta remote-all-files-meta-or-exp
                  local-all-files-meta  (<! local-all-files-meta-c)
                  diff-local-files      (diff-file-metadata-sets local-all-files-meta remote-all-files-meta)
                  change-events
                  (sequence
                   (comp
                    ;; convert to FileChangeEvent
                    (map #(->FileChangeEvent "change" base-path (.get-normalized-path ^FileMetadata %)
                                             {:size (:size %)} (:etag %)))
                    (remove ignored?))
                   diff-local-files)
                  change-events-partitions
                  (sequence
                   ;; partition FileChangeEvents
                   (partition-file-change-events 10)
                   (distinct-file-change-events change-events))]
              (println "[full-sync(local->remote)]"
                       (count (flatten change-events-partitions)) "files need to sync")
              (loop [es-partitions change-events-partitions]
                (if @*stopped
                  {:stop true}
                  (if (empty? es-partitions)
                    {:succ true}
                    (let [{:keys [succ need-sync-remote graph-has-been-deleted unknown] :as r}
                          (<! (<sync-local->remote! this (first es-partitions)))]
                      (s/assert ::sync-local->remote!-result r)
                      (cond
                        succ
                        (recur (next es-partitions))
                        (or need-sync-remote graph-has-been-deleted unknown) r)))))))))))

;;; ### put all stuff together

(defrecord ^:large-vars/cleanup-todo
 SyncManager [graph-uuid base-path *sync-state
              ^Local->RemoteSyncer local->remote-syncer ^Remote->LocalSyncer remote->local-syncer remoteapi
              ^:mutable ratelimit-local-changes-chan
              *txid ^:mutable state ^:mutable _remote-change-chan ^:mutable _*ws *stopped? *paused?
              ^:mutable ops-chan
              ;; control chans
              private-full-sync-chan private-stop-sync-chan private-remote->local-sync-chan
              private-remote->local-full-sync-chan private-pause-resume-chan]
  Object
  (schedule [this next-state args reason]
    {:pre [(s/valid? ::state next-state)]}
    (println "[SyncManager" graph-uuid "]"
             (and state (name state)) "->" (and next-state (name next-state)) :reason reason :now (tc/to-string (t/now)))
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
        (<! (.remote->local-full-sync this nil))
        ::pause
        (<! (.pause this))
        ::stop
        (-stop! this))))

  (start [this]
    (set! ops-chan (chan (async/dropping-buffer 10)))
    (set! _*ws (atom nil))
    (set! _remote-change-chan (ws-listen! graph-uuid _*ws))
    (set! ratelimit-local-changes-chan (<ratelimit local->remote-syncer local-changes-revised-chan))
    (setup-local->remote! local->remote-syncer)
    (async/tap full-sync-mult private-full-sync-chan)
    (async/tap stop-sync-mult private-stop-sync-chan)
    (async/tap remote->local-sync-mult private-remote->local-sync-chan)
    (async/tap remote->local-full-sync-mult private-remote->local-full-sync-chan)
    (async/tap pause-resume-mult private-pause-resume-chan)
    (go-loop []
      (let [{:keys [stop remote->local remote->local-full-sync local->remote-full-sync local->remote resume pause]}
            (async/alt!
              private-stop-sync-chan {:stop true}
              private-remote->local-full-sync-chan {:remote->local-full-sync true}
              private-remote->local-sync-chan {:remote->local true}
              private-full-sync-chan {:local->remote-full-sync true}
              private-pause-resume-chan ([v] (if v {:resume true} {:pause true}))
              _remote-change-chan ([v] (println "remote change:" v) {:remote->local v})
              ratelimit-local-changes-chan ([v]
                                            (let [rest-v (util/drain-chan ratelimit-local-changes-chan)
                                                  vs     (cons v rest-v)]
                                              (println "local changes:" vs)
                                              {:local->remote vs}))
              (timeout (* 20 60 1000)) {:local->remote-full-sync true}
              :priority true)]
        (cond
          stop
          (do (util/drain-chan ops-chan)
              (>! ops-chan {:stop true}))
          remote->local-full-sync
          (do (util/drain-chan ops-chan)
              (>! ops-chan {:remote->local-full-sync true})
              (recur))
          remote->local
          (let [txid
                (if (true? remote->local)
                  {:txid (:TXId (<! (<get-remote-graph remoteapi nil graph-uuid)))}
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
          (<! (<ensure-set-env&keys graph-uuid *stopped?))
            ;; wait seconds to receive all file change events,
            ;; and then drop all of them.
            ;; WHY: when opening a graph(or switching to another graph),
            ;;      file-watcher will send a lot of file-change-events,
            ;;      actually, each file corresponds to a file-change-event,
            ;;      we need to ignore all of them.
          (<! (timeout 3000))
          (println :drain-local-changes-chan-at-starting
                   (count (util/drain-chan local-changes-revised-chan))))
        (if @*stopped?
          (.schedule this ::stop nil nil)
          (.schedule this next-state nil nil)))))

  (pause [this]
    (put-sync-event! {:event :pause
                      :data {:graph-uuid graph-uuid
                             :epoch (tc/to-epoch (t/now))}})
    (go-loop []
      (let [{:keys [resume]} (<! ops-chan)]
        (if resume
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
                              :data {:graph-uuid graph-uuid
                                     :resume-state resume-state
                                     :epoch (tc/to-epoch (t/now))}})
            (<! (.schedule this ::idle nil :resume)))
          (recur)))))

  (idle [this]
    (go
      (let [{:keys [stop remote->local local->remote local->remote-full-sync remote->local-full-sync pause]}
            (<! ops-chan)]
        (cond
          stop
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
          :else
          (<! (.schedule this ::stop nil nil))))))

  (full-sync [this]
    (go
      (let [{:keys [succ need-sync-remote graph-has-been-deleted unknown stop] :as r}
            (<! (<sync-local->remote-all-files! local->remote-syncer))]
        (s/assert ::sync-local->remote-all-files!-result r)
        (cond
          succ
          (do (put-sync-event! {:event :finished-local->remote
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
            (put-sync-event! {:event :local->remote-full-sync-failed
                              :data {:graph-uuid graph-uuid
                                     :epoch (tc/to-epoch (t/now))}})
            (.schedule this ::idle nil nil))))))

  (remote->local-full-sync [this _next-state]
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
            (put-sync-event! {:event :remote->local-full-sync-failed
                              :data {:graph-uuid graph-uuid
                                     :epoch (tc/to-epoch (t/now))}})
            (.schedule this ::idle nil nil))))))

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
                (.schedule this ::idle nil nil)))))))

  (local->remote [this {local-changes :local}]
    ;; local-changes:: list of FileChangeEvent
    (assert (some? local-changes) local-changes)
    (go
      (let [distincted-local-changes (distinct-file-change-events local-changes)
            change-events-partitions
            (sequence (partition-file-change-events 10) distincted-local-changes)
            {:keys [succ need-sync-remote graph-has-been-deleted unknown stop pause]}
            (loop [es-partitions change-events-partitions]
              (cond
                @*stopped?             {:stop true}
                @*paused?              {:pause true}
                (empty? es-partitions) {:succ true}
                :else
                (let [{:keys [succ need-sync-remote graph-has-been-deleted pause unknown] :as r}
                      (<! (<sync-local->remote! local->remote-syncer (first es-partitions)))]
                  (s/assert ::sync-local->remote!-result r)
                  (cond
                    succ
                    (recur (next es-partitions))
                    (or need-sync-remote graph-has-been-deleted unknown pause) r))))]
        (cond
          succ
          (do (put-sync-event! {:event :finished-local->remote
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
            (.schedule this ::idle nil nil))))))
  IStoppable
  (-stop! [_]
    (go
      (when-not @*stopped?
        (vreset! *stopped? true)
        (ws-stop! _*ws)
        (offer! private-stop-sync-chan true)
        (async/untap full-sync-mult private-full-sync-chan)
        (async/untap stop-sync-mult private-stop-sync-chan)
        (async/untap remote->local-sync-mult private-remote->local-sync-chan)
        (async/untap remote->local-full-sync-mult private-remote->local-full-sync-chan)
        (async/untap pause-resume-mult private-pause-resume-chan)
        (when ops-chan (async/close! ops-chan))
        (stop-local->remote! local->remote-syncer)
        (stop-remote->local! remote->local-syncer)
        (debug/pprint ["stop sync-manager, graph-uuid" graph-uuid "base-path" base-path])
        (swap! *sync-state sync-state--update-state ::stop)
        (loop []
          (when (not= ::stop state)
            (<! (timeout 100))
            (recur))))))

  IStopped?
  (-stopped? [_]
    @*stopped?))

(defn sync-manager [user-uuid graph-uuid base-path repo txid *sync-state]
  (let [*txid (atom txid)
        *stopped? (volatile! false)
        *paused? (volatile! false)
        remoteapi-with-stop (->RemoteAPI *stopped?)
        local->remote-syncer (->Local->RemoteSyncer user-uuid graph-uuid
                                                    base-path
                                                    repo *sync-state remoteapi-with-stop
                                                    20000
                                                    *txid nil (chan) *stopped? *paused?
                                                    (chan 1) (chan 1))
        remote->local-syncer (->Remote->LocalSyncer user-uuid graph-uuid base-path
                                                    repo *txid *sync-state remoteapi-with-stop
                                                    nil *stopped? *paused?)]
    (.set-remote->local-syncer! local->remote-syncer remote->local-syncer)
    (.set-local->remote-syncer! remote->local-syncer local->remote-syncer)
    (swap! *sync-state sync-state--update-current-syncing-graph-uuid graph-uuid)
    (->SyncManager graph-uuid base-path *sync-state local->remote-syncer remote->local-syncer remoteapi-with-stop
                   nil *txid nil nil nil *stopped? *paused? nil (chan 1) (chan 1) (chan 1) (chan 1) (chan 1))))

(def ^:private current-sm-graph-uuid (atom nil))

(defn sync-manager-singleton
  [user-uuid graph-uuid base-path repo txid *sync-state]
  (when-not @current-sm-graph-uuid
    (reset! current-sm-graph-uuid graph-uuid)
    (sync-manager user-uuid graph-uuid base-path repo txid *sync-state)))

(defn <sync-stop []
  (go
    (when-let [sm ^SyncManager (state/get-file-sync-manager)]
      (println "[SyncManager" (:graph-uuid sm) "]" "stopping")
      (<! (-stop! sm))
      (println "[SyncManager" (:graph-uuid sm) "]" "stopped")
      (state/set-file-sync-manager nil))
    (reset! current-sm-graph-uuid nil)))

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

(declare network-online-cursor)

(defn sync-start []
  (let [*sync-state                 (atom (sync-state))
        current-user-uuid           (user/user-uuid)
        repo                        (state/get-current-repo)]
    (go
      (when @network-online-cursor
        ;; stop previous sync
        (<! (<sync-stop))

        (<! (p->c (persist-var/-load graphs-txid)))

        (let [[user-uuid graph-uuid txid] @graphs-txid]
          (when (and user-uuid graph-uuid txid
                     (user/logged-in?)
                     repo
                     (not (config/demo-graph? repo)))
            (when-some [sm (sync-manager-singleton current-user-uuid graph-uuid
                                                   (config/get-repo-dir repo) repo
                                                   txid *sync-state)]
              (when (check-graph-belong-to-current-user current-user-uuid user-uuid)
                (if-not (<! (<check-remote-graph-exists graph-uuid)) ; remote graph has been deleted
                  (clear-graphs-txid! repo)
                  (do
                    (state/set-file-sync-state repo @*sync-state)
                    (state/set-file-sync-manager sm)

                    ;; update global state when *sync-state changes
                    (add-watch *sync-state ::update-global-state
                               (fn [_ _ _ n]
                                 (state/set-file-sync-state repo n)))

                    (.start sm)

                    (offer! remote->local-full-sync-chan true)
                    (offer! full-sync-chan true)))))))))))

;;; ### some add-watches

;; TOOD: replace this logic by pause/resume state
(defonce network-online-cursor (rum/cursor state/state :network/online?))
(add-watch network-online-cursor "sync-manage"
           (fn [_k _r o n]
             (cond
               (and (true? o) (false? n))
               (<sync-stop)

               (and (false? o) (true? n))
               (sync-start)

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
(async/sub sync-events-publication :remote->local-full-sync-failed re-remote->local-full-sync-chan)
(go-loop []
  (let [{{graph-uuid :graph-uuid} :data} (<! re-remote->local-full-sync-chan)
        {:keys [current-syncing-graph-uuid]}
        (state/get-file-sync-state (state/get-current-repo))]
    (when (= graph-uuid current-syncing-graph-uuid)
      (offer! remote->local-full-sync-chan true))
    (recur)))

;; re-exec local->remote-full-sync when it failed
(def re-local->remote-full-sync-chan (chan 1))
(async/sub sync-events-publication :local->remote-full-sync-failed re-local->remote-full-sync-chan)
(go-loop []
  (let [{{graph-uuid :graph-uuid} :data} (<! re-local->remote-full-sync-chan)
        {:keys [current-syncing-graph-uuid]} (state/get-file-sync-state (state/get-current-repo))]
    (when (= graph-uuid current-syncing-graph-uuid)
      (offer! full-sync-chan true))
    (recur)))



;;; debug funcs
(comment
  ;; (<get-remote-all-files-meta remoteapi graph-uuid)
  (<get-local-all-files-meta rsapi graph-uuid
                             (config/get-repo-dir (state/get-current-repo)))
  (def base-path (config/get-repo-dir (state/get-current-repo)))
  )


;;; add-tap
(comment
  (def *x (atom nil))
  (add-tap (fn [v] (reset! *x v)))

  )
