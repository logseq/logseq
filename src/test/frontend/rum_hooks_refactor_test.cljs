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
    :vars ["use-container-id"]}
   {:file "src/main/frontend/rfx.cljs"
    :vars ["use-sub"]}
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
    (is (re-find #"(?s)\(let\s+\[[^\]]*installed-ui-items\s+\(rfx/use-sub \[:plugin/installed-ui-items\]\)[^\]]*pinned-items\s+\(rfx/use-sub \[:plugin/preferences :pinnedToolbarItems\]\)[^\]]*updates-coming\s+\(rfx/use-sub \[:plugin/updates-coming\]\)"
                 hook-ui-items-source)
        "hook-ui-items should call plugin state subscriptions unconditionally at the top of the component so plugin startup state changes do not alter React hook order")))

(deftest frontend-events-use-rfx-dispatch
  (let [state-source (source-for "src/main/frontend/state.cljs")
        events-source (source-for "src/main/frontend/handler/events.cljs")
        event-ui-source (source-for "src/main/frontend/handler/events/ui.cljs")
        event-rtc-source (source-for "src/main/frontend/handler/events/rtc.cljs")
        event-export-source (source-for "src/main/frontend/handler/events/export.cljs")]
    (testing "frontend.state no longer owns a core.async system event channel"
      (is (not (string/includes? state-source ":system/events")))
      (is (not (string/includes? state-source "get-events-chan"))))

    (testing "event namespaces register RFX handlers instead of starting a channel loop or multimethod bridge"
      (is (string/includes? events-source "[frontend.rfx :as rfx]"))
      (is (string/includes? events-source "register-rfx-handlers!"))
      (is (string/includes? events-source "rfx/reg-event-fx!"))
      (is (not (string/includes? events-source "async/go-loop")))
      (is (not (string/includes? events-source "async/<! chan")))
      (doseq [source [events-source event-ui-source event-rtc-source event-export-source]]
        (is (not (re-find #"\(defmethod\s+(?:events/)?handle\b" source)))))))

(deftest root-render-provides-rfx-context
  (testing "app roots provide the Logseq RFX context"
    (doseq [file ["src/main/frontend/core.cljs"
                  "src/main/frontend/publishing.cljs"]]
      (let [source (source-for file)]
        (is (string/includes? source "[frontend.rfx :as rfx]")
            (str file " should require frontend.rfx"))
        (is (string/includes? source "(rfx/provider (page/current-page))")
            (str file " should wrap current-page with rfx/provider"))))))

(deftest db-query-hook-uses-rfx-subscriptions
  (let [hooks-source (source-for "src/main/frontend/db/hooks.cljs")
        react-source (source-for "src/main/frontend/db/react.cljs")]
    (testing "UI-facing DB query hook subscribes through RFX"
      (is (string/includes? hooks-source "[frontend.rfx :as rfx]"))
      (is (string/includes? hooks-source "(rfx/use-sub [:db/query-results query-key])"))
      (is (not (string/includes? hooks-source "hooks/use-state")))
      (is (not (string/includes? hooks-source "add-watch"))))

    (testing "DB query refresh writes query results into RFX state"
      (is (string/includes? react-source "[frontend.state :as state]"))
      (is (string/includes? react-source "sync-query-result!"))
      (is (string/includes? react-source "(state/set-state! :db/query-results"))
      (is (string/includes? react-source ":nested-path [k]")))

    (testing "DB query render path does not write RFX state"
      (is (not (string/includes? react-source "(doto (set-query-key! result-atom k)"))
          "Cached react/q calls should only tag the atom during render.")
      (is (not (re-find #"set! \(\.-state result-atom\) result'\s+\(sync-query-result!" react-source))
          "Synchronous react/q calls should let use-query sync from an effect."))))

(deftest frontend-state-flows-derive-from-rfx
  (let [flows-source (source-for "src/main/frontend/flows.cljs")
        state-source (source-for "src/main/frontend/state.cljs")
        user-source (source-for "src/main/frontend/handler/user.cljs")]
    (testing "frontend.flows derives app state streams from RFX app-db"
      (is (string/includes? flows-source "[frontend.rfx :as rfx]"))
      (is (string/includes? flows-source "sub-atom"))
      (is (string/includes? flows-source "(sub-atom [:git/current-repo])"))
      (is (string/includes? flows-source "(sub-atom [:auth/current-login-user])"))
      (is (string/includes? flows-source "(sub-atom [:network/online?])"))
      (is (not (re-find #"\(def\s+\*current-(?:repo|login-user)" flows-source)))
      (is (not (string/includes? flows-source "*network-online?"))))

    (testing "state writers no longer write parallel flow atoms"
      (doseq [source [state-source user-source]]
        (is (not (re-find #"flows/\*current-|flows/\*network-online" source)))))))
