(ns logseq.tasks.db-graph.create-graph-with-clojure-irc-history
  "Import local #clojure IRC log HTML pages into a Logseq DB graph."
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.outliner.cli :as outliner-cli]
            [nbb.classpath :as cp]
            [nbb.core :as nbb]))

(def ^:private default-base-url "https://chouser.us/clojure-log/")
(def ^:private default-source-dir
  (or (.. js/process -env -CLOJURE_LOG_SOURCE_DIR)
      "/Users/tiensonqin/Codes/projects/clojure-irc-history"))

(def spec
  "Options spec"
  {:help {:alias :h
          :desc "Print help"}
   :base-url {:alias :u
              :default default-base-url
              :desc "Base URL for log pages"}
   :source-dir {:alias :m
                :default default-source-dir
                :desc "Local mirror root or clojure-log directory containing index.html and year folders"}
   :limit-days {:alias :l
                :desc "Maximum number of day pages to import"}
   :batch-days {:alias :b
                :default 200
                :desc "Number of day pages transacted per batch"}
   :verbose {:alias :v
             :desc "Verbose mode"}})

(def ^:private html-entity-map
  {"&quot;" "\""
   "&amp;" "&"
   "&lt;" "<"
   "&gt;" ">"
   "&apos;" "'"
   "&#39;" "'"
   "&nbsp;" " "})

(defn- parse-long-option
  [value]
  (if (string? value)
    (js/parseInt value 10)
    value))

(defn- normalize-base-url
  [base-url]
  (if (string/ends-with? base-url "/")
    base-url
    (str base-url "/")))

(defn- normalize-options
  [options]
  (-> options
      (update :limit-days parse-long-option)
      (update :batch-days parse-long-option)
      (update :base-url normalize-base-url)))

(defn parse-args
  [args]
  {:graph-dir (first args)
   :options (normalize-options (cli/parse-opts (rest args) {:spec spec}))})

(defn- decode-html-entity
  [entity]
  (or (html-entity-map entity)
      (when-let [[_ code] (re-matches #"&#(\d+);" entity)]
        (js/String.fromCodePoint (js/parseInt code 10)))
      (when-let [[_ code] (re-matches #"&#x([0-9a-fA-F]+);" entity)]
        (js/String.fromCodePoint (js/parseInt code 16)))
      entity))

(defn- decode-html-entities
  [s]
  (string/replace s #"&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);" decode-html-entity))

(defn- strip-html
  [s]
  (-> s
      (string/replace #"(?is)<a[^>]*>(.*?)</a>" "$1")
      (string/replace #"(?is)<[^>]+>" "")
      decode-html-entities
      string/trim))

(defn extract-day-paths
  [index-html]
  (->> (re-seq #"href=\"((\d{4})/\2-\d{2}-\d{2}\.html)\"" index-html)
       (map second)
       distinct
       sort
       vec))

(defn- day-path->date
  [day-path]
  (some-> (re-find #"\d{4}-\d{2}-\d{2}" day-path)
          str))

(defn select-day-paths
  [day-paths {:keys [limit-days]}]
  (->> day-paths
       (take (or limit-days js/Number.MAX_SAFE_INTEGER))
       vec))

(defn- date->journal-day
  [date]
  (some-> date
          (string/replace "-" "")
          (js/parseInt 10)))

(defn extract-chat-rows
  [day-html]
  (->> (re-seq #"(?s)<tr[^>]*>\s*<td><a[^>]*>([^<]+)</a></td><td[^>]*>(.*?)</td><td>(.*?)</td></tr>" day-html)
       (map (fn [[_ time nick-html message-html]]
              {:time (string/trim time)
               :nick (strip-html nick-html)
               :message (strip-html message-html)}))
       vec))

(defn date-time->timestamp-ms
  [date time]
  (let [[_ year month day] (re-matches #"(\d{4})-(\d{2})-(\d{2})" date)
        [_ hour minute] (re-matches #"(\d{1,2}):(\d{2})" time)]
    (when (and year month day hour minute)
      (js/Date.UTC (js/parseInt year 10)
                   (dec (js/parseInt month 10))
                   (js/parseInt day 10)
                   (js/parseInt hour 10)
                   (js/parseInt minute 10)
                   0
                   0))))

(defn build-user-pages
  [user->uuid]
  (->> user->uuid
       (sort-by key)
       (mapv (fn [[user-name user-uuid]]
               {:page {:block/uuid user-uuid
                       :build/keep-uuid? true
                       :block/title user-name
                       :build/properties {:logseq.property.user/name user-name}}
                :blocks []}))))

(defn build-page-and-blocks
  [{:keys [date day-path base-url user->uuid chat-rows]}]
  {:page {:build/journal (date->journal-day date)}
   :blocks
   (mapv (fn [{:keys [time nick message]}]
           (let [timestamp (date-time->timestamp-ms date time)
                 user-uuid (get user->uuid nick)]
             {:block/title (str time " " nick ": " message)
              :block/created-at timestamp
              :block/updated-at timestamp
              :build/properties {:logseq.property/created-by-ref [:block/uuid user-uuid]}}))
         chat-rows)})

(defn- extract-day-date
  [day-html day-path]
  (or (some-> (re-find #"<p class=\"dh\">([^<]+)</p>" day-html)
              second)
      (day-path->date day-path)))

(defn- read-text-file
  [path]
  (str (fs/readFileSync path "utf8")))

(defn- error-message
  [error]
  (or (ex-message error)
      (some-> error .-message)
      (str error)))

(defn resolve-source-dir
  [source-dir]
  (let [candidates [source-dir
                    (node-path/join source-dir "clojure-log")
                    (node-path/join source-dir "chouser.github.io-master" "clojure-log")]
        found (some (fn [candidate]
                      (when (fs/existsSync (node-path/join candidate "index.html"))
                        candidate))
                    candidates)]
    (or found
        (throw (ex-info (str "Could not find clojure-log source directory from: " source-dir)
                        {:source-dir source-dir
                         :candidates candidates})))))

(defn- fetch-day-page-data
  [base-url day-path day-html]
  (let [day-url (str base-url day-path)
        date (extract-day-date day-html day-path)
        chat-rows (extract-chat-rows day-html)]
    {:date date
     :day-path day-path
     :base-url base-url
     :chat-rows chat-rows}))

(defn- load-source-day-page-data
  [base-url source-dir day-path]
  (fetch-day-page-data base-url
                       day-path
                       (read-text-file (node-path/join source-dir day-path))))

(defn- ensure-user!
  [user->uuid* new-users* user-name]
  (if-let [user-uuid (get @user->uuid* user-name)]
    user-uuid
    (let [user-uuid (random-uuid)]
      (swap! user->uuid* assoc user-name user-uuid)
      (swap! new-users* conj user-name)
      user-uuid)))

(defn- transact-batch!
  [conn pages-and-blocks]
  (let [{:keys [init-tx block-props-tx]}
        (outliner-cli/build-blocks-tx {:pages-and-blocks pages-and-blocks})]
    (d/transact! conn init-tx)
    (when (seq block-props-tx)
      (d/transact! conn block-props-tx))))

(defn -main [args]
  (let [{:keys [graph-dir options]} (parse-args args)
        _ (when (or (nil? graph-dir) (:help options))
            (println (str "Usage: $0 GRAPH-NAME [OPTIONS]\nOptions:\n"
                          (cli/format-opts {:spec spec})))
            (js/process.exit 1))
        {:keys [base-url source-dir batch-days verbose]} options
        resolved-source-dir (resolve-source-dir source-dir)
        index-html (read-text-file (node-path/join resolved-source-dir "index.html"))
        all-day-paths (extract-day-paths index-html)
        selected-day-paths (select-day-paths all-day-paths options)
        init-conn-args (sqlite-cli/->open-db-args graph-dir)
        db-name (if (= 1 (count init-conn-args))
                  (first init-conn-args)
                  (second init-conn-args))
        conn (apply outliner-cli/init-conn
                    (conj init-conn-args {:classpath (cp/get-classpath)}))
        total-day-count (count selected-day-paths)
        total-batches (js/Math.ceil (/ total-day-count batch-days))
        user->uuid* (atom {})
        imported-stats (atom {:days 0 :messages 0})]
    (println "Found" (count all-day-paths) "day pages in index")
    (println "Using source directory:" resolved-source-dir)
    (println "Importing" total-day-count "day pages to graph" (str "'" db-name "'")
             "in" total-batches "batch(es)")
    (doseq [[batch-index day-path-batch] (map-indexed vector (partition-all batch-days selected-day-paths))]
      (println "Processing batch" (inc batch-index) "of" total-batches
               "with" (count day-path-batch) "day pages")
      (let [new-users* (atom #{})
            day-pages-and-blocks
            (->> day-path-batch
                 (map (fn [day-path]
                        (try
                          (when verbose
                            (println "Loading source log" day-path "..."))
                          (let [day-page-data (load-source-day-page-data base-url resolved-source-dir day-path)
                                _ (doseq [{:keys [nick]} (:chat-rows day-page-data)]
                                    (ensure-user! user->uuid* new-users* nick))]
                            (when (seq (:chat-rows day-page-data))
                              (build-page-and-blocks (assoc day-page-data
                                                            :user->uuid @user->uuid*))))
                          (catch :default e
                            (println "Skipping" day-path ":" (error-message e))
                            nil))))
                 (remove nil?)
                 vec)
            new-user-pages-and-blocks (build-user-pages (select-keys @user->uuid* @new-users*))
            pages-and-blocks (vec (concat new-user-pages-and-blocks day-pages-and-blocks))]
        (swap! imported-stats
               (fn [{:keys [days messages]}]
                 {:days (+ days (count day-pages-and-blocks))
                  :messages (+ messages
                               (reduce
                                (fn [acc {:keys [blocks]}]
                                  (+ acc (count blocks)))
                                0
                                day-pages-and-blocks))}))
        (when (seq pages-and-blocks)
          (transact-batch! conn pages-and-blocks))))
    (let [{:keys [days messages]} @imported-stats]
      (println "Imported" days "pages and" messages "chat messages into graph" (str "'" db-name "'") "."))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
