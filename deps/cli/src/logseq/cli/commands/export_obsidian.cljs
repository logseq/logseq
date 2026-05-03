(ns logseq.cli.commands.export-obsidian
  "Export a Logseq DB backup into an Obsidian vault directory."
  (:require ["fs" :as fs]
            ["jszip$default" :as JSZip]
            ["os" :as os]
            ["path" :as node-path]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.cli.common.export.common :as cli-export-common]
            [logseq.cli.common.export.text :as cli-export-text]
            [logseq.cli.common.file :as common-file]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [promesa.core :as p]))

(def ^:private assets-dir-name "assets")
(def ^:private report-file-name "logseq-obsidian-export-report.json")

(def ^:private wikilink-pattern
  (js/RegExp. "(!?)\\[\\[([^\\]|]+)(?:\\|([^\\]]+))?\\]\\]" "g"))

(defn- ensure-dir! [path]
  (fs/mkdirSync path #js {:recursive true}))

(defn- path-exists? [path]
  (fs/existsSync path))

(defn- file? [path]
  (and (path-exists? path) (.isFile (fs/statSync path))))

(defn- dir? [path]
  (and (path-exists? path) (.isDirectory (fs/statSync path))))

(defn- temp-dir [prefix]
  (fs/mkdtempSync (node-path/join (os/tmpdir) prefix)))

(defn- keepable-title [title page-uuid]
  (let [title' (some-> title str string/trim)]
    (if (string/blank? title')
      (str "untitled__" (subs page-uuid 0 8))
      title')))

(defn- sanitize-file-stem [title]
  (let [normalized (-> (or title "")
                       (string/replace #"[/\\:*?\"<>|]" "-")
                       (string/replace #"[\x00-\x1F\x7F]" "")
                       string/trim
                       (string/replace #"\.+$" "")
                       (string/replace #"^\.+$" "untitled"))]
    (if (string/blank? normalized) "untitled" normalized)))

(defn- nonblank-length [text]
  (count (string/trim (or text ""))))

(defn- safe-zip-target-path [dest-dir entry-name]
  (let [root-path (node-path/resolve dest-dir)
        target-path (node-path/resolve root-path entry-name)
        root-prefix (str root-path (.-sep node-path))]
    (when (or (string/blank? entry-name)
              (node-path/isAbsolute entry-name)
              (string/includes? entry-name "\\")
              (not (string/starts-with? target-path root-prefix)))
      (throw (ex-info (str "Unsafe zip entry path: " entry-name)
                      {:entry entry-name})))
    target-path))

(defn- zip-entries [zip]
  (->> (js/Object.keys (.-files zip))
       (map #(aget (.-files zip) %))))

(defn- write-zip-entry! [dest-dir entry]
  (let [target-path (safe-zip-target-path dest-dir (.-name entry))]
    (if (.-dir entry)
      (ensure-dir! target-path)
      (p/let [payload (.async entry "nodebuffer")]
        (ensure-dir! (node-path/dirname target-path))
        (fs/writeFileSync target-path payload)))))

(defn- extract-zip! [zip-path dest-dir]
  (p/let [zip (.loadAsync (JSZip.) (fs/readFileSync zip-path))]
    (p/all (map #(write-zip-entry! dest-dir %) (zip-entries zip)))))

(defn- find-db-root [dir]
  (let [entries (fs/readdirSync dir #js {:withFileTypes true})]
    (or
     (some (fn [entry]
             (let [full-path (node-path/join dir (.-name entry))]
               (when (and (.isFile entry) (= "db.sqlite" (.-name entry)))
                 {:db-path full-path
                  :root-dir dir
                  :assets-dir (let [candidate (node-path/join dir assets-dir-name)]
                                (when (dir? candidate) candidate))})))
           entries)
     (some (fn [entry]
             (let [full-path (node-path/join dir (.-name entry))]
               (when (.isDirectory entry)
                 (find-db-root full-path))))
           entries))))

(defn- resolved-db-file [resolved]
  {:db-path resolved
   :root-dir (node-path/dirname resolved)
   :assets-dir (let [candidate (node-path/join (node-path/dirname resolved)
                                               assets-dir-name)]
                 (when (dir? candidate) candidate))
   :cleanup (constantly nil)})

(defn- cleanup-temp! [tmp-dir keep-temp?]
  (when-not keep-temp?
    (fs/rmSync tmp-dir #js {:recursive true :force true})))

(defn- resolve-zip-input! [resolved keep-temp?]
  (let [tmp-dir (temp-dir "logseq-obsidian-")]
    (-> (p/let [_ (extract-zip! resolved tmp-dir)]
          (if-let [{:keys [db-path root-dir assets-dir]} (find-db-root tmp-dir)]
            {:db-path db-path
             :root-dir root-dir
             :assets-dir assets-dir
             :temp-dir tmp-dir
             :cleanup #(cleanup-temp! tmp-dir keep-temp?)}
            (do
              (cleanup-temp! tmp-dir keep-temp?)
              (cli-util/error "Could not find db.sqlite inside" resolved))))
        (p/catch (fn [error]
                   (cleanup-temp! tmp-dir keep-temp?)
                   (throw error))))))

(defn- resolve-dir-input! [resolved]
  (if-let [{:keys [db-path root-dir assets-dir]} (find-db-root resolved)]
    {:db-path db-path
     :root-dir root-dir
     :assets-dir assets-dir
     :cleanup (constantly nil)}
    (cli-util/error "Directory does not contain a db.sqlite file:" resolved)))

(defn- resolve-input! [input keep-temp?]
  (let [resolved (node-path/resolve input)]
    (cond
      (and (file? resolved) (string/ends-with? resolved ".zip"))
      (resolve-zip-input! resolved keep-temp?)

      (and (file? resolved) (= "db.sqlite" (node-path/basename resolved)))
      (resolved-db-file resolved)

      (dir? resolved)
      (resolve-dir-input! resolved)

      :else
      (cli-util/error "Input path does not exist or is unsupported:" resolved))))

(defn- exportable-page? [entity]
  (or (not (:logseq.property/built-in? entity))
      (contains? sqlite-create-graph/built-in-pages-names (:block/title entity))))

(defn- page-entities [db]
  (->> (d/datoms db :avet :block/name)
       (map #(d/entity db (:e %)))
       (filter exportable-page?)
       distinct
       (map (fn [entity]
              {:uuid (str (:block/uuid entity))
               :title (keepable-title (:block/title entity) (str (:block/uuid entity)))
               :journal? (some? (:block/journal-day entity))
               :journal-day (:block/journal-day entity)}))
       (sort-by (juxt :title :uuid))
       vec))

(defn- render-page [db content-config {:keys [title journal? journal-day] page-uuid-str :uuid}]
  (let [page-uuid (cljs.core/uuid page-uuid-str)
        raw-content (or (common-file/block->content db page-uuid {} content-config) "")
        rendered (if (string/blank? raw-content)
                   ""
                   (binding [cli-export-common/*current-db* db
                             cli-export-common/*content-config* content-config]
                     (cli-export-text/export-helper raw-content :markdown nil)))]
    {:uuid page-uuid-str
     :title title
     :journal? journal?
     :journal-day journal-day
     :content rendered}))

(defn- unique-file-stem [used preferred block-uuid]
  (loop [candidate preferred
         n 1]
    (let [candidate-key (string/lower-case candidate)]
      (if (contains? @used candidate-key)
        (recur (if (= n 1)
                 (str preferred "__" (subs block-uuid 0 8))
                 (str preferred "__" (subs block-uuid 0 8) "_" n))
               (inc n))
        (do
          (swap! used conj candidate-key)
          candidate)))))

(defn- plan-title-group [used {:keys [planned warnings skipped]} title group]
  (let [ordered (->> group
                     (sort-by (fn [page]
                                [(- (nonblank-length (:content page))) (:uuid page)]))
                     vec)
        nonempty-count (count (filter #(pos? (nonblank-length (:content %))) ordered))
        stem (sanitize-file-stem title)]
    (reduce
     (fn [result [idx page]]
       (let [empty-content? (zero? (nonblank-length (:content page)))]
         (if (and (> idx 0) empty-content? (pos? nonempty-count))
           (-> result
               (update :warnings conj {:type :skip-empty-duplicate
                                       :title title
                                       :uuid (:uuid page)})
               (update :skipped inc))
           (let [preferred (if (zero? idx)
                             stem
                             (str stem "__" (subs (:uuid page) 0 8)))
                 file-stem (unique-file-stem used preferred (:uuid page))
                 file-name (str file-stem ".md")]
             (-> result
                 (update :planned conj (assoc page :file-name file-name))
                 (cond-> (> (count group) 1)
                   (update :warnings conj {:type :duplicate-title
                                           :title title
                                           :uuid (:uuid page)
                                           :file-name file-name
                                           :empty? empty-content?})))))))
     {:planned planned
      :warnings warnings
      :skipped skipped}
     (map-indexed vector ordered))))

(defn- plan-page-files [pages]
  (let [used (atom #{})]
    (reduce
     (fn [result [title group]]
       (plan-title-group used result title group))
     {:planned []
      :warnings []
      :skipped 0}
     (sort-by key (group-by :title pages)))))

(defn- asset-files-by-uuid [assets-dir]
  (if-not assets-dir
    {}
    (->> (fs/readdirSync assets-dir #js {:withFileTypes true})
         (filter #(.isFile %))
         (map (fn [entry]
                (let [filename (.-name entry)
                      parsed (node-path/parse filename)]
                  [(.-name parsed) (str assets-dir-name "/" filename)])))
         (into {}))))

(defn- asset-warning [title rows]
  (cond-> []
    (some #(nil? (:path %)) rows)
    (conj {:type :missing-asset-file
           :title title
           :uuids (mapv :uuid rows)})

    (> (count rows) 1)
    (conj {:type :duplicate-asset-title
           :title title
           :uuids (mapv :uuid rows)})))

(defn- asset-title-map [db assets-dir]
  (let [by-uuid (asset-files-by-uuid assets-dir)
        asset-rows (->> (d/q '[:find ?uuid ?title
                               :where
                               [?e :logseq.property.asset/type _]
                               [?e :block/uuid ?uuid]
                               [?e :block/title ?title]]
                             db)
                        (map (fn [[asset-uuid title]]
                               {:uuid (str asset-uuid)
                                :title (str title)
                                :path (get by-uuid (str asset-uuid))})))
        grouped (group-by :title asset-rows)]
    {:title->path
     (reduce-kv (fn [acc title rows]
                  (if (and (= 1 (count rows)) (:path (first rows)))
                    (assoc acc title (:path (first rows)))
                    acc))
                {}
                grouped)
     :warnings
     (reduce-kv (fn [acc title rows]
                  (into acc (asset-warning title rows)))
                []
                grouped)}))

(defn- rewrite-asset-links [content page-titles title->path]
  (if (string/blank? content)
    content
    (.replace
     content
     wikilink-pattern
     (fn [full bang target alias]
       (if-let [asset-path (and (not (contains? page-titles target))
                                (get title->path target))]
         (if (= "!" bang)
           (str "![[" asset-path "]]")
           (str "[[" asset-path "|" (or alias target) "]]"))
         full)))))

(defn- write-note! [output-dir {:keys [file-name content]}]
  (fs/writeFileSync (node-path/join output-dir file-name) content "utf8"))

(defn- write-report! [output-dir report]
  (fs/writeFileSync (node-path/join output-dir report-file-name)
                    (str (js/JSON.stringify (clj->js report) nil 2) "\n")
                    "utf8"))

(defn- copy-assets! [assets-dir output-dir]
  (when assets-dir
    (let [destination (node-path/join output-dir assets-dir-name)]
      (ensure-dir! destination)
      (fs/cpSync assets-dir destination #js {:recursive true :force true})
      true)))

(defn- export-vault! [{:keys [db-path assets-dir]} output-dir]
  (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args db-path))
        db @conn
        content-config {:export-bullet-indentation "\t"}
        rendered-pages (mapv #(render-page db content-config %) (page-entities db))
        {:keys [planned warnings skipped]} (plan-page-files rendered-pages)
        page-titles (set (map :title planned))
        asset-result (asset-title-map db assets-dir)
        planned' (mapv #(update % :content rewrite-asset-links
                                page-titles (:title->path asset-result))
                       planned)
        assets-copied? (do (ensure-dir! output-dir)
                           (boolean (copy-assets! assets-dir output-dir)))
        report {:input db-path
                :output output-dir
                :pages-written (count planned')
                :pages-skipped skipped
                :assets-copied? assets-copied?
                :asset-links-resolved (count (:title->path asset-result))
                :warnings (vec (concat warnings (:warnings asset-result)))}]
    (doseq [page planned']
      (write-note! output-dir page))
    (write-report! output-dir report)
    report))

(defn- print-summary! [output-dir report]
  (println "Exported" (:pages-written report) "notes to" output-dir)
  (when (:assets-copied? report)
    (println "Copied assets into" (node-path/join output-dir assets-dir-name)))
  (println "Wrote report to" (node-path/join output-dir report-file-name))
  (when (seq (:warnings report))
    (println "Warnings:" (count (:warnings report)))))

(defn export-obsidian [{{:keys [input output keep-temp]} :opts}]
  (when (or (string/blank? input) (string/blank? output))
    (cli-util/error "Command missing required options 'input' and 'output'"))
  (p/let [resolved (resolve-input! input keep-temp)
          output-dir (node-path/resolve output)]
    (-> (p/let [report (export-vault! resolved output-dir)]
          (print-summary! output-dir report)
          report)
        (p/finally (:cleanup resolved)))))
