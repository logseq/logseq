(ns frontend.rum-hooks-refactor-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]))

(def ^:private source-roots
  ["src/main/frontend"
   "src/main/mobile"
   "deps/shui/src"])

(def ^:private source-exts
  #{".cljs" ".cljc"})

(def ^:private forbidden-files
  ["src/main/frontend/mixins.cljs"
   "src/main/frontend/db_mixins.cljs"])

(def ^:private forbidden-patterns
  [{:label "rum/defcs"
    :pattern #"(^|[^\w.])rum/defcs\b"}
   {:label "rum/reactive"
    :pattern #"(^|[^\w.])rum/reactive\b"}
   {:label "rum/static"
    :pattern #"(^|[^\w.])rum/static\b"}
   {:label "rum/local"
    :pattern #"(^|[^\w.])rum/local\b"}
   {:label "frontend.mixins namespace"
    :pattern #"frontend\.mixins\b"}
   {:label "frontend.db-mixins namespace"
    :pattern #"frontend\.db-mixins\b"}
   {:label "Rum mount/update/unmount lifecycle map"
    :pattern #":(?:will-mount|did-mount|will-unmount|will-update|did-update|should-update|wrap-render|did-catch)\b"}
   {:label "Rum init lifecycle in component declaration"
    :pattern #"\(rum/defc[s]?[\s\S]*?<[\s\S]*?\{:init\b"}
   {:label "Rum private reactions"
    :pattern #"rum/\*reactions\*"}
   {:label "Rum internal args"
    :pattern #":rum/args\b"}])

(def ^:private required-hook-vars
  [{:file "deps/shui/src/logseq/shui/hooks.cljs"
    :vars ["use-event-listener"
           "use-window-keydown"
           "use-window-keyup"
           "use-hide-on-esc-or-outside"
           "use-modal-state"]}
   {:file "src/main/frontend/state.cljs"
    :vars ["use-sub"
           "use-sub-config"
           "use-sub-editing?"
           "use-container-id"]}
   {:file "src/main/frontend/db/hooks.cljs"
    :vars ["use-query"]}])

(defn- repo-root
  []
  (.cwd js/process))

(defn- source-file? [path]
  (contains? source-exts (node-path/extname path)))

(defn- walk-source-files [dir]
  (let [entries (array-seq (fs/readdirSync dir #js {:withFileTypes true}))]
    (mapcat
     (fn [entry]
       (let [entry-path (node-path/join dir (.-name entry))]
         (cond
           (.isDirectory entry)
           (walk-source-files entry-path)

           (and (.isFile entry)
                (source-file? entry-path))
           [entry-path]

           :else
           [])))
     entries)))

(defn- relative-path [path]
  (node-path/relative (repo-root) path))

(defn- matching-lines [source pattern]
  (keep-indexed
   (fn [idx line]
     (when (re-find pattern line)
       (inc idx)))
   (string/split-lines source)))

(defn- source-violations []
  (let [root (repo-root)]
    (->> source-roots
         (map #(node-path/join root %))
         (filter fs/existsSync)
         (mapcat walk-source-files)
         (mapcat
          (fn [path]
            (let [source (.toString (fs/readFileSync path "utf8"))]
              (keep
               (fn [{:keys [label pattern]}]
                 (let [lines (matching-lines source pattern)]
                   (when (seq lines)
                     {:file (relative-path path)
                      :label label
                      :lines lines})))
               forbidden-patterns))))
         (sort-by (juxt :file :label))
         vec)))

(defn- source-for [relative-file]
  (.toString (fs/readFileSync (node-path/join (repo-root) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (string/index-of source "\n(hsx/defc " (inc start))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(defn- hook-var-defined? [source var-name]
  (or (string/includes? source (str "(defn " var-name))
      (string/includes? source (str "(def " var-name))))

(deftest old-rum-mixin-api-is-fully-removed
  (testing "obsolete mixin namespaces are deleted"
    (let [root (repo-root)
          existing-files (filter #(fs/existsSync (node-path/join root %)) forbidden-files)]
      (is (empty? existing-files)
          (str "Remove obsolete mixin namespace files: "
               (string/join ", " existing-files)))))

  (testing "application source no longer uses Rum mixins or lifecycle maps"
    (let [violations (source-violations)]
      (is (empty? violations)
          (str "Remove old Rum mixin/lifecycle usage:\n"
               (string/join
                "\n"
                (map (fn [{:keys [file label lines]}]
                       (str file " " label " lines " (pr-str lines)))
                     violations))))))

  (testing "hook foundation remains available"
    (doseq [{:keys [file vars]} required-hook-vars
            var-name vars]
      (is (hook-var-defined? (source-for file) var-name)
          (str file " should define " var-name)))))

(deftest plugin-toolbar-hooks-are-stable
  (let [source (source-for "src/main/frontend/components/plugins.cljs")
        hook-ui-items-source (form-source source "(hsx/defc hook-ui-items")]
    (is (some? hook-ui-items-source)
        "hook-ui-items component should exist")
    (is (re-find #"(?s)\(let\s+\[[^\]]*installed-ui-items\s+\(state/use-sub \[:plugin/installed-ui-items\]\)[^\]]*pinned-items\s+\(state/use-sub \[:plugin/preferences :pinnedToolbarItems\]\)[^\]]*updates-coming\s+\(state/use-sub :plugin/updates-coming\)"
                 hook-ui-items-source)
        "hook-ui-items should call plugin state subscriptions unconditionally at the top of the component so plugin startup state changes do not alter React hook order")))
