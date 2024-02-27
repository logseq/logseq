(ns frontend.components.imports
  "Import data into Logseq."
  (:require [cljs.core.async.interop :refer [p->c]]
            [clojure.core.async :as async]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [cljs-time.core :as t]
            [cljs.pprint :as pprint]
            [datascript.core :as d]
            [frontend.components.onboarding.setups :as setups]
            [frontend.components.repo :as repo]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.import :as import-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.outliner.core :as outliner-core]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.common.config :as common-config]
            [logseq.shui.ui :as shui]
            [lambdaisland.glogi :as log]
            [logseq.db.frontend.validate :as db-validate]))

;; Can't name this component as `frontend.components.import` since shadow-cljs
;; will complain about it.

(defonce *opml-imported-pages (atom nil))

(defn- finished-cb
  []
  (route-handler/redirect-to-home!)
  (notification/show! "Import finished!" :success)
  (ui-handler/re-render-root!))

(defn- roam-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (gobj/get file "name")]
    (if (string/ends-with? file-name ".json")
      (do
        (state/set-state! :graph/importing :roam-json)
        (let [reader (js/FileReader.)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (import-handler/import-from-roam-json!
                     text
                     #(do
                        (state/set-state! :graph/importing nil)
                        (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a JSON file."
                          :error))))

(defn- lsq-import-handler
  [e & {:keys [sqlite? graph-name]}]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (some-> (gobj/get file "name")
                          (string/lower-case))
        edn? (string/ends-with? file-name ".edn")
        json? (string/ends-with? file-name ".json")]
    (cond
      sqlite?
      (let [graph-name (string/trim graph-name)]
        (cond
          (string/blank? graph-name)
          (notification/show! "Empty graph name." :error)

          (repo-handler/graph-already-exists? graph-name)
          (notification/show! "Please specify another name as another graph with this name already exists!" :error)

          :else
          (let [reader (js/FileReader.)]
            (set! (.-onload reader)
                  (fn []
                    (let [buffer (.-result ^js reader)]
                      (import-handler/import-from-sqlite-db! buffer graph-name finished-cb)
                      (state/close-modal!))))
            (set! (.-onerror reader) (fn [e] (js/console.error e)))
            (set! (.-onabort reader) (fn [e]
                                       (prn :debug :aborted)
                                       (js/console.error e)))
            (.readAsArrayBuffer reader file))))

      (or edn? json?)
      (do
        (state/set-state! :graph/importing :logseq)
        (let [reader (js/FileReader.)
              import-f (if edn?
                         import-handler/import-from-edn!
                         import-handler/import-from-json!)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (import-f
                     text
                     #(do
                        (state/set-state! :graph/importing nil)
                        (finished-cb))))))
          (.readAsText reader file)))

      :else
      (notification/show! "Please choose an EDN or a JSON file."
                          :error))))

(defn- opml-import-handler
  [e]
  (let [file      (first (array-seq (.-files (.-target e))))
        file-name (gobj/get file "name")]
    (if (string/ends-with? file-name ".opml")
      (do
        (state/set-state! :graph/importing :opml)
        (let [reader (js/FileReader.)]
          (set! (.-onload reader)
                (fn [e]
                  (let [text (.. e -target -result)]
                    (import-handler/import-from-opml! text
                                                      (fn [pages]
                                                        (reset! *opml-imported-pages pages)
                                                        (state/set-state! :graph/importing nil)
                                                        (finished-cb))))))
          (.readAsText reader file)))
      (notification/show! "Please choose a OPML file."
                          :error))))

(rum/defcs set-graph-name-dialog
  < rum/reactive
  (rum/local "" ::input)
  [state sqlite-input-e opts]
  (let [*input (::input state)
        on-submit #(if (repo/invalid-graph-name? @*input)
                     (repo/invalid-graph-name-warning)
                     (lsq-import-handler sqlite-input-e (assoc opts :graph-name @*input)))]
    [:div.container
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "New graph name:"]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2.mb-4
      {:auto-focus true
       :on-change (fn [e]
                    (reset! *input (util/evalue e)))
       :on-key-down (fn [e]
                      (when (= "Enter" (util/ekey e))
                        (on-submit)))}]

     [:div.mt-5.sm:mt-4.flex
      (ui/button "Submit"
                 {:on-click on-submit})]]))

(defn- import-from-asset-files!
  [asset-files]
  (let [ch (async/to-chan! asset-files)
        repo (state/get-current-repo)
        repo-dir (config/get-repo-dir repo)]
    (prn :in-files asset-files)
    (async/go-loop []
      (if-let [file (async/<! ch)]
        (do
          (async/<! (p->c (-> (.arrayBuffer (:file-object file))
                              (p/then (fn [buffer]
                                        (let [content (js/Uint8Array. buffer)
                                              parent-dir (path/path-join repo-dir (path/dirname (:rpath file)))]
                                          (p/do!
                                           (fs/mkdir-if-not-exists parent-dir)
                                           (fs/write-file! repo repo-dir (:rpath file) content {:skip-transact? true}))))))))
          (recur))
        true))))

(defn- build-hidden-favorites-page-blocks
  [page-block-uuid-coll]
  (map
   (fn [uuid]
     {:block/link [:block/uuid uuid]
      :block/content ""
      :block/format :markdown})
   page-block-uuid-coll))

(def hidden-favorites-page-name "$$$favorites")
(def hidden-favorites-page-tx
  {:block/uuid (d/squuid)
   :block/name hidden-favorites-page-name
   :block/original-name hidden-favorites-page-name
   :block/journal? false
   :block/type #{"hidden"}
   :block/format :markdown})

(defn- import-favorites-from-config-edn!
  [db-conn repo config-file]
  (let [now (inst-ms (js/Date.))]
    (p/do!
     (ldb/transact! repo [(assoc hidden-favorites-page-tx
                                 :block/created-at now
                                 :block/updated-at now)])
     (p/let [content (when config-file (.text (:file-object config-file)))]
       (when-let [content-edn (try (edn/read-string content)
                                   (catch :default _ nil))]
         (when-let [favorites (seq (:favorites content-edn))]
           (when-let [page-block-uuid-coll
                      (seq
                       (keep (fn [page-name]
                               (some-> (d/entity @db-conn [:block/name (common-util/page-name-sanity-lc page-name)])
                                       :block/uuid))
                             favorites))]
             (let [page-entity (d/entity @db-conn [:block/name hidden-favorites-page-name])]
               (ui-outliner-tx/transact!
                {:outliner-op :insert-blocks}
                (outliner-core/insert-blocks! repo db-conn (build-hidden-favorites-page-blocks page-block-uuid-coll)
                                              page-entity {}))))))))))

(rum/defc import-file-graph-dialog
  [initial-name on-graph-name-confirmed]
  (let [[graph-input set-graph-input!] (rum/use-state initial-name)
        [tag-classes-input set-tag-classes-input!] (rum/use-state "")
        [property-classes-input set-property-classes-input!] (rum/use-state "")
        on-submit #(do (on-graph-name-confirmed
                        {:graph-name graph-input
                         :tag-classes tag-classes-input
                         :property-classes property-classes-input})
                       (state/close-modal!))]
    [:div.container
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "New graph name:"]]]
     (shui/input
      {:class "my-2 mb-4"
       :auto-focus true
       :default-value graph-input
       :on-change (fn [e]
                    (set-graph-input! (util/evalue e)))
       :on-key-down (fn [e]
                      (when (= "Enter" (util/ekey e))
                        (on-submit)))})

     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "(Optional) Tags to import as tag classes:"]
       [:span.text-xs
        "Tags are case insensitive and separated by commas"]]]
     (shui/input
      {:class "my-2 mb-4"
       :default-value tag-classes-input
       :on-change (fn [e]
                    (set-tag-classes-input! (util/evalue e)))
       :on-key-down (fn [e]
                      (when (= "Enter" (util/ekey e))
                        (on-submit)))})

     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "(Optional) Properties whose values are imported as tag classes e.g. 'type':"]
       [:span.text-xs
        "Properties are case insensitive and separated by commas"]]]
     (shui/input
      {:class "my-2 mb-4"
       :default-value property-classes-input
       :on-change (fn [e]
                    (set-property-classes-input! (util/evalue e)))
       :on-key-down (fn [e]
                      (when (= "Enter" (util/ekey e))
                        (on-submit)))})

     (shui/button {:on-click on-submit} "Submit")]))

(defn- counts-from-entities
  [entities]
  {:entities (count entities)
   :pages (count (filter :block/name entities))
   :blocks (count (filter :block/content entities))
   :classes (count (filter #(contains? (:block/type %) "class") entities))
   :objects (count (filter #(seq (:block/tags %)) entities))
   :properties (count (filter #(contains? (:block/type %) "property") entities))
   :property-values (count (mapcat :block/properties entities))})

(defn- validate-imported-data
  [db import-state files]
  (when-let [org-files (seq (filter #(= "org" (path/file-ext (:rpath %))) files))]
    (log/info :org-files (mapv :rpath org-files))
    (notification/show! (str "Imported " (count org-files) " org file(s) as markdown. Support for org files will be added later.")
                        :info false))
  (when-let [ignored-props (seq @(:ignored-properties import-state))]
    (notification/show!
     [:.mb-2
      [:.text-lg.mb-2 (str "Import ignored " (count ignored-props) " "
                           (if (= 1 (count ignored-props)) "property" "properties"))]
      [:span.text-xs
       "To fix a property type, change the property value to the correct type and reimport the graph"]
      (->> ignored-props
           (map (fn [{:keys [property value schema location]}]
                  [(str "Property " (pr-str property) " with value " (pr-str value))
                   (if (= property :icon)
                     (if (:page location)
                       (str "Page icons can't be imported. Go to the page " (pr-str (:page location)) " to manually import it.")
                       (str "Block icons can't be imported. Manually import it at the block: " (pr-str (:block location))))
                     (str "Property value has type " (get-in schema [:type :to]) " instead of type " (get-in schema [:type :from])))]))
           (map (fn [[k v]]
                  [:dl.my-2.mb-0
                   [:dt.m-0 [:strong (str k)]]
                   [:dd {:class "text-warning"} v]])))]
     :warning false))
  (let [{:keys [errors datom-count entities]} (db-validate/validate-db! db)]
    (if errors
      (do
        (log/error :import-errors {:msg (str "Import detected " (count errors) " invalid block(s):")
                                   :counts (assoc (counts-from-entities entities) :datoms datom-count)})
        (pprint/pprint (map :entity errors))
        (notification/show! (str "Import detected " (count errors) " invalid block(s). These blocks may be buggy when you interact with them. See the javascript console for more.")
                            :warning false))
      (log/info :import-valid {:msg "Valid import!"
                               :counts (assoc (counts-from-entities entities) :datoms datom-count)}))))

(defn- show-notification [{:keys [msg level ex-data]}]
  (if (= :error level)
    (do
      (notification/show! msg :error)
      (when ex-data
        (log/error :import-error ex-data)))
    (notification/show! msg :warning false)))

(defn- import-file-graph
  [*files {:keys [graph-name tag-classes property-classes]} config-file]
  (state/set-state! :graph/importing :file-graph)
  (state/set-state! [:graph/importing-state :current-page] "Config files")
  (async/go
    (let [start-time (t/now)
          _ (async/<! (p->c (repo-handler/new-db! graph-name {:file-graph-import? true})))
          repo (state/get-current-repo)
          db-conn (db/get-db repo false)
          <read-file (fn [file] (.text (:file-object file)))
          config (async/<! (p->c (gp-exporter/import-config-file!
                                  repo config-file <read-file
                                  {:notify-user show-notification
                                   :default-config config/config-default-content
                                   :<save-file (fn [_ path content]
                                                 (let [migrated-content (repo-handler/migrate-db-config content)]
                                                   (db-editor-handler/save-file! path migrated-content)))})))
          files (common-config/remove-hidden-files *files config :rpath)
          logseq-file? #(string/starts-with? (:rpath %) "logseq/")
          doc-files (->> files
                         (remove logseq-file?)
                         (filter #(contains? #{"md" "org" "markdown" "edn"} (path/file-ext (:rpath %)))))
          asset-files (filter #(string/starts-with? (:rpath %) "assets/") files)
          import-options (merge
                          (gp-exporter/setup-import-options
                           @db-conn
                           config
                           {:tag-classes (set (string/split tag-classes #",\s*"))
                            :property-classes (set (string/split property-classes #",\s*"))}
                           {:macros (:macros config)
                            :notify-user show-notification})
                          {:set-ui-state state/set-state!
                           ;; Write to frontend first as writing to worker first is poor ux with slow streaming changes
                           :import-file (fn import-file [conn m opts]
                                          (let [tx-report
                                                (gp-exporter/add-file-to-db-graph conn (:file/path m) (:file/content m) opts)]
                                            (db-browser/transact! @db-browser/*worker repo (:tx-data tx-report) (:tx-meta tx-report))))})]
      (async/<! (p->c (gp-exporter/import-logseq-files (state/get-current-repo)
                                                       (filter logseq-file? files)
                                                       <read-file
                                                       {:<save-file (fn [_ path content]
                                                                      (db-editor-handler/save-file! path content))
                                                        :notify-user show-notification})))
      (state/set-state! [:graph/importing-state :current-page] "Asset files")
      (async/<! (import-from-asset-files! asset-files))
      (async/<! (p->c (gp-exporter/import-from-doc-files! db-conn doc-files <read-file import-options)))
      (async/<! (p->c (import-favorites-from-config-edn! db-conn repo config-file)))
      (log/info :import-file-graph {:msg (str "Import finished in " (/ (t/in-millis (t/interval start-time (t/now))) 1000) " seconds")})
      (state/set-state! :graph/importing nil)
      (state/set-state! :graph/importing-state nil)
      (validate-imported-data @db-conn (:import-state import-options) files)
      (finished-cb))))

(defn import-file-to-db-handler
  "Import from a graph folder as a DB-based graph.

- Page name, journal name creation"
  [ev _opts]
  (let [^js file-objs (array-seq (.-files (.-target ev)))
        original-graph-name (string/replace (.-webkitRelativePath (first file-objs)) #"/.*" "")
        import-graph-fn (fn [user-inputs]
                          (let [files (->> file-objs
                                           (map #(hash-map :file-object %
                                                           :rpath (path/trim-dir-prefix original-graph-name (.-webkitRelativePath %))))
                                           (remove #(and (not (string/starts-with? (:rpath %) "assets/"))
                                                         ;; TODO: Update this when supporting more formats as this aggressively excludes most formats
                                                         (fs-util/ignored-path? original-graph-name (.-webkitRelativePath (:file-object %))))))]
                            (if-let [config-file (first (filter #(= (:rpath %) "logseq/config.edn") files))]
                              (import-file-graph files user-inputs config-file)
                              (notification/show! "Import failed as the file 'logseq/config.edn' was not found for a Logseq graph."
                                                  :error))))]
    (state/set-modal!
     #(import-file-graph-dialog original-graph-name
                                (fn [{:keys [graph-name] :as user-inputs}]
                                  (cond
                                    (repo/invalid-graph-name? graph-name)
                                    (repo/invalid-graph-name-warning)

                                    (string/blank? graph-name)
                                    (notification/show! "Empty graph name." :error)

                                    (repo-handler/graph-already-exists? graph-name)
                                    (notification/show! "Please specify another name as another graph with this name already exists!" :error)

                                    :else
                                    (import-graph-fn user-inputs)))))))


  (rum/defc importer < rum/reactive
    [{:keys [query-params]}]
    (if (state/sub :graph/importing)
      (let [{:keys [total current-idx current-page]} (state/sub :graph/importing-state)
            left-label (if (and current-idx total (= current-idx total))
                         [:div.flex.flex-row.font-bold "Loading UI ..."]
                         [:div.flex.flex-row.font-bold
                          (t :importing)
                          [:div.hidden.md:flex.flex-row
                           [:span.mr-1 ": "]
                           [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                            current-page]]])
            width (js/Math.round (* (.toFixed (/ current-idx total) 2) 100))
            process (when (and total current-idx)
                      (str current-idx "/" total))]
        (ui/progress-bar-with-label width left-label process))
      (setups/setups-container
       :importer
       [:article.flex.flex-col.items-center.importer.py-16.px-8
        [:section.c.text-center
         [:h1 (t :on-boarding/importing-title)]
         [:h2 (t :on-boarding/importing-desc)]]
        [:section.d.md:flex.flex-col
         [:label.action-input.flex.items-center.mx-2.my-2
          [:span.as-flex-center [:i (svg/logo 28)]]
          [:span.flex.flex-col
           [[:strong "SQLite"]
            [:small (t :on-boarding/importing-sqlite-desc)]]]
          [:input.absolute.hidden
           {:id        "import-sqlite-db"
            :type      "file"
            :on-change (fn [e]
                         (state/set-modal!
                          #(set-graph-name-dialog e {:sqlite? true})))}]]

         (when (or util/electron? util/web-platform?)
          [:label.action-input.flex.items-center.mx-2.my-2
           [:span.as-flex-center [:i (svg/logo 28)]]
           [:span.flex.flex-col
            [[:strong "File to DB graph"]
             [:small  "Import a file-based Logseq graph folder into a new DB graph"]]]
           [:input.absolute.hidden
            {:id        "import-file-graph"
             :type      "file"
             :webkitdirectory "true"
             :on-change (debounce (fn [e]
                                    (import-file-to-db-handler e {}))
                                  1000)}]])

         [:label.action-input.flex.items-center.mx-2.my-2
          [:span.as-flex-center [:i (svg/logo 28)]]
          [:span.flex.flex-col
           [[:strong "EDN / JSON"]
            [:small (t :on-boarding/importing-lsq-desc)]]]
          [:input.absolute.hidden
           {:id        "import-lsq"
            :type      "file"
            :on-change lsq-import-handler}]]

         [:label.action-input.flex.items-center.mx-2.my-2
          [:span.as-flex-center [:i (svg/roam-research 28)]]
          [:div.flex.flex-col
           [[:strong "RoamResearch"]
            [:small (t :on-boarding/importing-roam-desc)]]]
          [:input.absolute.hidden
           {:id        "import-roam"
            :type      "file"
            :on-change roam-import-handler}]]

         [:label.action-input.flex.items-center.mx-2.my-2
          [:span.as-flex-center.ml-1 (ui/icon "sitemap" {:size 26})]
          [:span.flex.flex-col
           [[:strong "OPML"]
            [:small (t :on-boarding/importing-opml-desc)]]]

          [:input.absolute.hidden
           {:id        "import-opml"
            :type      "file"
            :on-change opml-import-handler}]]]

        (when (= "picker" (:from query-params))
          [:section.e
           [:a.button {:on-click #(route-handler/redirect-to-home!)} "Skip"]])])))
