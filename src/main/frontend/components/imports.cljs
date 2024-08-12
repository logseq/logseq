(ns frontend.components.imports
  "Import data into Logseq."
  (:require [clojure.string :as string]
            [cljs-time.core :as t]
            [cljs.pprint :as pprint]
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
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.util.fs :as fs-util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [logseq.common.path :as path]
            [logseq.graph-parser.exporter :as gp-exporter]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.shui.ui :as shui]
            [logseq.shui.dialog.core :as shui-dialog]
            [lambdaisland.glogi :as log]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db :as ldb]))

;; Can't name this component as `frontend.components.import` since shadow-cljs
;; will complain about it.

(defonce *opml-imported-pages (atom nil))

(defn- finished-cb
  []
  (notification/show! "Import finished!" :success)
  (shui/dialog-close! :import-indicator)
  (ui-handler/re-render-root!)
  (route-handler/redirect-to-home!))

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
                      (shui/dialog-close!))))
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
       [:h3#modal-headline.leading-6.font-medium.pb-2
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

(rum/defc import-file-graph-dialog
  [initial-name on-graph-name-confirmed]
  (let [[graph-input set-graph-input!] (rum/use-state initial-name)
        [tag-classes-input set-tag-classes-input!] (rum/use-state "")
        [property-classes-input set-property-classes-input!] (rum/use-state "")
        [property-parent-classes-input set-property-parent-classes-input!] (rum/use-state "")
        on-submit #(do (on-graph-name-confirmed
                        {:graph-name graph-input
                         :tag-classes tag-classes-input
                         :property-classes property-classes-input
                         :property-parent-classes property-parent-classes-input})
                       (shui/dialog-close!))]
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
        "(Optional) Tags to import as new tags:"]
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
        "(Optional) Properties whose values are imported as new tags e.g. 'type':"]
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

     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium
        "(Optional) Properties whose values are imported as parents of new tags e.g. 'parent':"]
       [:span.text-xs
        "Properties are case insensitive and separated by commas"]]]
     (shui/input
      {:class "my-2 mb-4"
       :default-value property-parent-classes-input
       :on-change (fn [e]
                    (set-property-parent-classes-input! (util/evalue e)))
       :on-key-down (fn [e]
                      (when (= "Enter" (util/ekey e))
                        (on-submit)))})

     (shui/button {:size :sm :on-click on-submit} "Submit")]))

(defn- counts-from-entities
  [entities]
  {:entities (count entities)
   :pages (count (filter :block/name entities))
   :blocks (count (filter :block/title entities))
   :classes (count (filter ldb/class? entities))
   :objects (count (filter #(seq (:block/tags %)) entities))
   :properties (count (filter ldb/property? entities))
   :property-values (count (mapcat :block/properties entities))})

(defn- validate-imported-data
  [db import-state files]
  (when-let [org-files (seq (filter #(= "org" (path/file-ext (:path %))) files))]
    (log/info :org-files (mapv :path org-files))
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
                     (if (not= (get-in schema [:type :to]) (get-in schema [:type :from]))
                       (str "Property value has type " (get-in schema [:type :to]) " instead of type " (get-in schema [:type :from]))
                       (str "Property should be imported manually")))]))
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
        (pprint/pprint errors)
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

(defn- copy-asset [repo repo-dir file]
  (-> (.arrayBuffer (:file-object file))
      (p/then (fn [buffer]
                (let [content (js/Uint8Array. buffer)
                      parent-dir (path/path-join repo-dir (path/dirname (:path file)))]
                  (p/do!
                   (fs/mkdir-if-not-exists parent-dir)
                   (fs/write-file! repo repo-dir (:path file) content {:skip-transact? true})))))))

(defn- import-file-graph
  [*files {:keys [graph-name tag-classes property-classes property-parent-classes]} config-file]
  (state/set-state! :graph/importing :file-graph)
  (state/set-state! [:graph/importing-state :current-page] "Config files")
  (p/let [start-time (t/now)
          _ (repo-handler/new-db! graph-name {:file-graph-import? true})
          repo (state/get-current-repo)
          db-conn (db/get-db repo false)
          options {;; user options
                   :tag-classes (set (string/split tag-classes #",\s*"))
                   :property-classes (set (string/split property-classes #",\s*"))
                   :property-parent-classes (set (string/split property-parent-classes #",\s*"))
                   ;; common options
                   :notify-user show-notification
                   :set-ui-state state/set-state!
                   :<read-file (fn <read-file [file] (.text (:file-object file)))
                   ;; config file options
                   :default-config config/config-default-content
                   :<save-config-file (fn save-config-file [_ path content]
                                        (let [migrated-content (repo-handler/migrate-db-config content)]
                                          (db-editor-handler/save-file! path migrated-content)))
                   ;; logseq file options
                   :<save-logseq-file (fn save-logseq-file [_ path content]
                                        (db-editor-handler/save-file! path content))
                   ;; asset file options
                   :<copy-asset #(copy-asset repo (config/get-repo-dir repo) %)
                   ;; doc file options
                   ;; Write to frontend first as writing to worker first is poor ux with slow streaming changes
                   :export-file (fn export-file [conn m opts]
                                  (let [tx-reports
                                        (gp-exporter/add-file-to-db-graph conn (:file/path m) (:file/content m) opts)]
                                    (doseq [tx-report tx-reports]
                                      (db-browser/transact! @db-browser/*worker repo (:tx-data tx-report) (:tx-meta tx-report)))))}
          {:keys [files import-state]} (gp-exporter/export-file-graph repo db-conn config-file *files options)]
    (log/info :import-file-graph {:msg (str "Import finished in " (/ (t/in-millis (t/interval start-time (t/now))) 1000) " seconds")})
    (state/set-state! :graph/importing nil)
    (state/set-state! :graph/importing-state nil)
    (validate-imported-data @db-conn import-state files)
    (state/pub-event! [:graph/ready (state/get-current-repo)])
    (finished-cb)))

(defn import-file-to-db-handler
  "Import from a graph folder as a DB-based graph.

- Page name, journal name creation"
  [ev _opts]
  (let [^js file-objs (array-seq (.-files (.-target ev)))
        original-graph-name (string/replace (.-webkitRelativePath (first file-objs)) #"/.*" "")
        import-graph-fn (fn [user-inputs]
                          (let [files (->> file-objs
                                           (map #(hash-map :file-object %
                                                           :path (path/trim-dir-prefix original-graph-name (.-webkitRelativePath %))))
                                           (remove #(and (not (string/starts-with? (:path %) "assets/"))
                                                         ;; TODO: Update this when supporting more formats as this aggressively excludes most formats
                                                         (fs-util/ignored-path? original-graph-name (.-webkitRelativePath (:file-object %))))))]
                            (if-let [config-file (first (filter #(= (:path %) "logseq/config.edn") files))]
                              (import-file-graph files user-inputs config-file)
                              (notification/show! "Import failed as the file 'logseq/config.edn' was not found for a Logseq graph."
                                                  :error))))]
    (shui/dialog-open!
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

(rum/defc indicator-progress < rum/reactive
  []
  (let [{:keys [total current-idx current-page]} (state/sub :graph/importing-state)
        left-label (if (and current-idx total (= current-idx total))
                     [:div.flex.flex-row.font-bold "Loading ..."]
                     [:div.flex.flex-row.font-bold
                      (t :importing)
                      [:div.hidden.md:flex.flex-row
                       [:span.mr-1 ": "]
                       [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                        current-page]]])
        width (js/Math.round (* (.toFixed (/ current-idx total) 2) 100))
        process (when (and total current-idx)
                  (str current-idx "/" total))]
    [:div.p-5
     (ui/progress-bar-with-label width left-label process)]))

(rum/defc import-indicator
  [importing?]
  (rum/use-effect!
    (fn []
      (when (and importing? (not (shui-dialog/get-modal :import-indicator)))
        (shui/dialog-open! indicator-progress
          {:id :import-indicator
           :content-props
           {:onPointerDownOutside #(.preventDefault %)
            :onOpenAutoFocus #(.preventDefault %)}})))
    [importing?])
  [:<>])

(rum/defc importer < rum/reactive
  [{:keys [query-params]}]
  (let [support-file-based? (config/local-file-based-graph? (state/get-current-repo))
        importing? (state/sub :graph/importing)]
    [:<>
     (import-indicator importing?)
     (when-not importing?
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
             {:id "import-sqlite-db"
              :type "file"
              :on-change (fn [e]
                           (shui/dialog-open!
                             #(set-graph-name-dialog e {:sqlite? true})))}]]

           (when (or (util/electron?) util/web-platform?)
             [:label.action-input.flex.items-center.mx-2.my-2
              [:span.as-flex-center [:i (svg/logo 28)]]
              [:span.flex.flex-col
               [[:strong "File to DB graph"]
                [:small "Import a file-based Logseq graph folder into a new DB graph"]]]
              [:input.absolute.hidden
               {:id "import-file-graph"
                :type "file"
                :webkitdirectory "true"
                :on-change (debounce (fn [e]
                                       (import-file-to-db-handler e {}))
                             1000)}]])

           (when (and (util/electron?) support-file-based?)
             [:label.action-input.flex.items-center.mx-2.my-2
              [:span.as-flex-center [:i (svg/logo 28)]]
              [:span.flex.flex-col
               [[:strong "EDN / JSON"]
                [:small (t :on-boarding/importing-lsq-desc)]]]
              [:input.absolute.hidden
               {:id "import-lsq"
                :type "file"
                :on-change lsq-import-handler}]])

           (when (and (util/electron?) support-file-based?)
             [:label.action-input.flex.items-center.mx-2.my-2
              [:span.as-flex-center [:i (svg/roam-research 28)]]
              [:div.flex.flex-col
               [[:strong "RoamResearch"]
                [:small (t :on-boarding/importing-roam-desc)]]]
              [:input.absolute.hidden
               {:id "import-roam"
                :type "file"
                :on-change roam-import-handler}]])

           (when (and (util/electron?) support-file-based?)
             [:label.action-input.flex.items-center.mx-2.my-2
              [:span.as-flex-center.ml-1 (ui/icon "sitemap" {:size 26})]
              [:span.flex.flex-col
               [[:strong "OPML"]
                [:small (t :on-boarding/importing-opml-desc)]]]

              [:input.absolute.hidden
               {:id "import-opml"
                :type "file"
                :on-change opml-import-handler}]])]

          (when (= "picker" (:from query-params))
            [:section.e
             [:a.button {:on-click #(route-handler/redirect-to-home!)} "Skip"]])]))]))
