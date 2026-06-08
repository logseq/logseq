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
                  (string/index-of source "\n(defn" (inc start))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(defn- assert-form-does-not-match!
  [relative-file marker pattern message]
  (let [source (source-for relative-file)
        form (form-source source marker)]
    (is (some? form)
        (str relative-file " should contain " marker))
    (is (not (re-find pattern form))
        message)))

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

(deftest react-hooks-are-not-called-behind-render-guards
  (doseq [[relative-file marker pattern message]
          [["src/main/frontend/components/rtc/indicator.cljs"
            "(hsx/defc downloading-detail"
            #"(?s)\(when\s+[^\n]*\(hooks/use-flow-state"
            "downloading-detail should subscribe before deciding whether to render the button"]
           ["src/main/frontend/components/rtc/indicator.cljs"
            "(hsx/defc uploading-detail"
            #"(?s)\(when\s+[^\n]*\(hooks/use-flow-state"
            "uploading-detail should subscribe before deciding whether to render the button"]
           ["deps/shui/src/logseq/shui/table/core.cljc"
            "(hsx/defc table-header"
            #"(?s)\(when-not\s+\(mobile\?\)\s+\(use-sticky-element!"
            "table-header should call its sticky hook on every render and branch inside the effect"]
           ["src/main/frontend/components/editor.cljs"
            "(hsx/defc page-search\n"
            #"(?s)\(when\s+input[\s\S]*\(use-current-edit-content"
            "page-search should read editor hook state before branching on DOM input availability"]
           ["src/main/frontend/components/editor.cljs"
            "(hsx/defc template-search\n"
            #"(?s)\(when\s+input[\s\S]*\(use-current-edit-content"
            "template-search should read editor hook state before branching on DOM input availability"]
           ["src/main/frontend/components/editor.cljs"
            "(hsx/defc code-block-mode-picker"
            #"(?s)\(when-let[\s\S]*\(hooks/use-memo"
            "code-block-mode-picker should call hooks before CodeMirror/input guards"]
           ["src/main/frontend/components/property/dialog.cljs"
            "(hsx/defc dialog"
            #"(?s)\(when\s+\(seq blocks\)[\s\S]*\(hooks/use-"
            "property dialog should create hook state before checking whether blocks are present"]
           ["src/main/frontend/components/reference.cljs"
            "(hsx/defc references\n"
            #"(?s)\(when-let\s+\[id \(:db/id entity\)\][\s\S]*\(hooks/use-"
            "references should call hooks before checking entity id"]
           ["src/main/frontend/components/reference.cljs"
            "(hsx/defc unlinked-references"
            #"(?s)\(when-let\s+\[id \(:db/id entity\)\][\s\S]*\(hooks/use-"
            "unlinked-references should call hooks before checking entity id"]
           ["src/main/frontend/components/page.cljs"
            "(hsx/defc page-blocks-cp"
            #"(?s)\(when-let\s+\[id \(:db/id block\*\)\][\s\S]*\(state/use-sub"
            "page-blocks-cp should subscribe before checking block id"]
           ["src/main/frontend/components/page.cljs"
            "(hsx/defc today-queries"
            #"(?s)\(when\s+\(and today\? \(not sidebar\?\)\)[\s\S]*\(state/use-sub-config"
            "today-queries should subscribe before checking whether today queries are visible"]
           ["src/main/frontend/components/left_sidebar.cljs"
            "(hsx/defc ^:large-vars/cleanup-todo sidebar-navigations"
            #"(?s)\(when\s+\(state/enable-flashcards\?[\s\S]*\(state/use-sub"
            "sidebar-navigations should subscribe before checking flashcards feature availability"]
           ["src/main/frontend/components/container.cljs"
            "(hsx/defc new-block-mode"
            #"(?s)\(when\s+\(state/use-sub"
            "new-block-mode should subscribe before deciding whether to render the mode toggle"]
           ["src/main/frontend/components/settings.cljs"
            "(hsx/defc markdown-mirror-row"
            #"(?s)\(when\s+repo\s+\(state/use-sub"
            "markdown-mirror-row should subscribe before checking current repo"]
           ["src/main/frontend/components/settings.cljs"
            "(hsx/defc auto-chmod-row"
            #"(?s)\(if\s+\(= nil \(state/use-sub"
            "auto-chmod-row should subscribe once before deriving its enabled state"]
           ["src/main/frontend/page.cljs"
            "(hsx/defc current-page"
            #"(?s)\(if-let\s+\[route-match \(state/use-sub"
            "current-page should subscribe before branching on the route match"]]]
    (assert-form-does-not-match! relative-file marker pattern message)))
