(ns frontend.components.imports
  "Import data into Logseq."
  (:require ["path" :as node-path]
            [cljs-time.core :as t]
            [cljs.pprint :as pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.components.onboarding.setups :as setups]
            [frontend.components.repo :as repo]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.db-based.editor :as db-editor-handler]
            [frontend.handler.db-based.import :as db-import-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.graph-parser.exporter :as gp-exporter]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.form.core :as form-core]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defn- ignored-path?
  "Ignore path for ls-dir-files-with-handler! and reload-dir!"
  [dir path]
  (let [ignores ["." ".recycle" "node_modules" "logseq/bak"
                 "logseq/version-files" "logseq/graphs-txid.edn"]]
    (when (string? path)
      (or
       (some #(string/starts-with? path
                                   (if (= dir "")
                                     %
                                     (str dir "/" %))) ignores)
       (some #(string/includes? path (if (= dir "")
                                       (str "/" % "/")
                                       (str % "/"))) ignores)
       (some #(string/ends-with? path %)
             [".DS_Store" "logseq/graphs-txid.edn"])
      ;; hidden directory or file
       (let [relpath (node-path/relative dir path)]
         (or (re-find #"/\.[^.]+" relpath)
             (re-find #"^\.[^.]+" relpath)))
       (let [path (string/lower-case path)]
         (and
          (not (string/blank? (node-path/extname path)))
          (not
           (some #(string/ends-with? path %)
                 [".md" ".markdown" ".org" ".js" ".edn" ".css"]))))))))

(defn- finished-cb
  []
  (state/pub-event! [:graph/sync-context])
  (notification/show! "Import finished!" :success)
  (shui/dialog-close! :import-indicator)
  (route-handler/redirect-to-home!)
  (if util/web-platform?
    (js/window.location.reload)
    (js/setTimeout ui-handler/re-render-root! 500)))

(defn- lsq-import-handler
  [e & {:keys [sqlite? debug-transit? graph-name db-edn?]}]
  (let [file      (first (array-seq (.-files (.-target e))))]
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
                      (db-import-handler/import-from-sqlite-db! buffer graph-name finished-cb)
                      (shui/dialog-close!))))
            (set! (.-onerror reader) (fn [e] (js/console.error e)))
            (set! (.-onabort reader) (fn [e]
                                       (prn :debug :aborted)
                                       (js/console.error e)))
            (.readAsArrayBuffer reader file))))

      (or debug-transit? db-edn?)
      (let [graph-name (string/trim graph-name)]
        (cond
          (string/blank? graph-name)
          (notification/show! "Empty graph name." :error)

          (repo-handler/graph-already-exists? graph-name)
          (notification/show! "Please specify another name as another graph with this name already exists!" :error)

          :else
          (do
            (state/set-state! :graph/importing :logseq)
            (let [reader (js/FileReader.)
                  import-f (if db-edn?
                             db-import-handler/import-from-edn-file!
                             db-import-handler/import-from-debug-transit!)]
              (set! (.-onload reader)
                    (fn [e]
                      (let [text (.. e -target -result)]
                        (import-f
                         graph-name
                         text
                         #(do
                            (state/set-state! :graph/importing nil)
                            (finished-cb)
                            ;; graph input not closing
                            (shui/dialog-close-all!))))))
              (.readAsText reader file)))))

      :else
      (notification/show! "Please choose an EDN or a JSON file."
                          :error))))

(rum/defcs set-graph-name-dialog
  < rum/reactive
  (rum/local "" ::input)
  [state input-e opts]
  (let [*input (::input state)
        on-submit #(if (repo/invalid-graph-name? @*input)
                     (repo/invalid-graph-name-warning)
                     (lsq-import-handler input-e (assoc opts :graph-name @*input)))]
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
  [initial-name on-submit-fn]
  [:div.border.p-6.rounded.bg-gray-01.mt-4
   (let [form-ctx (form-core/use-form
                   {:defaultValues {:graph-name initial-name
                                    :convert-all-tags? true
                                    :tag-classes ""
                                    :remove-inline-tags? true
                                    :property-classes ""
                                    :property-parent-classes ""}
                    :yupSchema (-> (.object form-core/yup)
                                   (.shape #js {:graph-name (-> (.string form-core/yup) (.required))})
                                   (.required))})
         handle-submit (:handleSubmit form-ctx)
         on-submit-valid (handle-submit
                          (fn [^js e]
                            ;; (js/console.log "[form] submit: " e (js->clj e))
                            (on-submit-fn (js->clj e :keywordize-keys true))
                            (shui/dialog-close!)))
         [convert-all-tags-input set-convert-all-tags-input!] (rum/use-state true)]

     (shui/form-provider form-ctx
                         [:form
                          {:on-submit on-submit-valid}

                          (shui/form-field {:name "graph-name"}
                                           (fn [field error]
                                             (shui/form-item
                                              (shui/form-label "New graph name")
                                              (shui/form-control
                                               (shui/input (merge {:placeholder "Graph name"} field)))
                                              (when error
                                                (shui/form-description
                                                 [:b.text-red-800 (:message error)])))))

                          (shui/form-field {:name "convert-all-tags?"}
                                           (fn [field]
                                             (shui/form-item
                                              {:class "pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
                                              (shui/form-label "Import all tags")
                                              (shui/form-control
                                               (shui/checkbox {:checked (:value field)
                                                               :on-checked-change (fn [e]
                                                                                    ((:onChange field) e)
                                                                                    (set-convert-all-tags-input! (not convert-all-tags-input)))})))))

                          (shui/form-field {:name "tag-classes"}
                                           (fn [field _error]
                                             (shui/form-item
                                              {:class "pt-3"}
                                              (shui/form-label "Import specific tags")
                                              (shui/form-control
                                               (shui/input (merge field
                                                                  {:placeholder "tag 1, tag 2" :disabled convert-all-tags-input})))
                                              (shui/form-description "Tags are case insensitive"))))

                          (shui/form-field {:name "remove-inline-tags?"}
                                           (fn [field]
                                             (shui/form-item
                                              {:class "pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
                                              (shui/form-label "Remove inline tags")
                                              (shui/form-description "Default behavior for DB graphs")
                                              (shui/form-control
                                               (shui/checkbox {:checked (:value field)
                                                               :on-checked-change (:onChange field)})))))

                          (shui/form-field {:name "property-classes"}
                                           (fn [field _error]
                                             (shui/form-item
                                              {:class "pt-3"}
                                              (shui/form-label "Import additional tags from property values")
                                              (shui/form-control
                                               (shui/input (merge {:placeholder "e.g. type"} field)))
                                              (shui/form-description
                                               "Properties are case insensitive and separated by commas"))))

                          (shui/form-field {:name "property-parent-classes"}
                                           (fn [field _error]
                                             (shui/form-item
                                              {:class "pt-3"}
                                              (shui/form-label "Import tag parents from property values")
                                              (shui/form-control
                                               (shui/input (merge {:placeholder "e.g. parent"} field)))
                                              (shui/form-description
                                               "Properties are case insensitive and separated by commas"))))

                          (shui/button {:type "submit" :class "right-0 mt-3"} "Submit")]))])

(defn- validate-imported-data
  [db import-state files]
  (when-let [org-files (seq (filter #(= "org" (path/file-ext (:path %))) files))]
    (log/info :org-files (mapv :path org-files))
    (notification/show! (str "Imported " (count org-files) " org file(s) as markdown. Support for org files will be added later.")
                        :info false))
  (when-let [ignored-files (seq @(:ignored-files import-state))]
    (notification/show! (str "Import ignored " (count ignored-files) " "
                             (if (= 1 (count ignored-files)) "file" "files")
                             ". See the javascript console for more details.")
                        :info false)
    (log/error :import-ignored-files {:msg (str "Import ignored " (count ignored-files) " file(s)")})
    (pprint/pprint ignored-files))
  (when-let [ignored-assets (seq @(:ignored-assets import-state))]
    (notification/show! (str "Import ignored " (count ignored-assets) " "
                             (if (= 1 (count ignored-assets)) "asset" "assets")
                             ". See the javascript console for more details.")
                        :info false)
    (log/error :import-ignored-assets {:msg (str "Import ignored " (count ignored-assets) " asset(s)")})
    (pprint/pprint ignored-assets))
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
  (let [{:keys [errors]} (db-validate/validate-local-db! db {:verbose true})]
    (if errors
      (do
        (log/error :import-errors {:msg (str "Import detected " (count errors) " invalid block(s):")})
        (pprint/pprint errors)
        (notification/show! (str "Import detected " (count errors) " invalid block(s). These blocks may be buggy when you interact with them. See the javascript console for more.")
                            :warning false))
      (log/info :import-valid {:msg "Valid import!"}))))

(defn- show-notification [{:keys [msg level ex-data]}]
  (if (= :error level)
    (do
      (notification/show! msg :error)
      (when ex-data
        (log/error :import-error ex-data)))
    (notification/show! msg :warning false)))

(defn- read-and-copy-asset [repo repo-dir file assets buffer-handler]
  (let [^js file-object (:file-object file)]
    (if (assets-handler/exceed-limit-size? file-object)
      (do
        (js/console.log (str "Skipped copying asset " (pr-str (:path file)) " because it is larger than the 100M max."))
        ;; This asset will also be included in the ignored-assets count. Better to be explicit about ignoring
        ;; these so users are aware of this
        (notification/show!
         (str "Skipped copying asset " (pr-str (:path file)) " because it is larger than the 100M max.")
         :info
         false))
      (p/let [buffer (.arrayBuffer file-object)
              bytes-array (js/Uint8Array. buffer)
              checksum (db-asset/<get-file-array-buffer-checksum buffer)
              asset-id (d/squuid)
              asset-name (some-> (:path file) gp-exporter/asset-path->name)
              assets-dir (path/path-join repo-dir common-config/local-assets-dir)
              asset-type (db-asset/asset-path->type (:path file))
              {:keys [with-edn-content pdf-annotation?]} (buffer-handler bytes-array)]
        (swap! assets assoc asset-name
               (with-edn-content
                 {:size (.-size file-object)
                  :type asset-type
                  :path (:path file)
                  :checksum checksum
                  :asset-id asset-id}))
        (fs/mkdir-if-not-exists assets-dir)
        (when-not pdf-annotation?
          (fs/write-plain-text-file! repo assets-dir (str asset-id "." asset-type) bytes-array {:skip-transact? true}))))))

(defn- import-file-graph
  [*files
   {:keys [graph-name tag-classes property-classes property-parent-classes] :as user-options}
   config-file]
  (state/set-state! :graph/importing :file-graph)
  (state/set-state! [:graph/importing-state :current-page] "Config files")
  (p/let [start-time (t/now)
          _ (repo-handler/new-db! graph-name {:file-graph-import? true})
          repo (state/get-current-repo)
          db-conn (db/get-db repo false)
          options {:user-options
                   (merge
                    (dissoc user-options :graph-name)
                    {:tag-classes (some-> tag-classes string/trim not-empty  (string/split #",\s*") set)
                     :property-classes (some-> property-classes string/trim not-empty  (string/split #",\s*") set)
                     :property-parent-classes (some-> property-parent-classes string/trim not-empty  (string/split #",\s*") set)})
                   ;; common options
                   :notify-user show-notification
                   :set-ui-state state/set-state!
                   :<read-file (fn <read-file [file] (.text (:file-object file)))
                   :<get-file-stat (fn <get-file-stat [path]
                                     (when (util/electron?)
                                       (ipc/ipc :stat path)))
                   ;; config file options
                   :default-config config/config-default-content
                   :<save-config-file (fn save-config-file [_ path content]
                                        (db-editor-handler/save-file! path content))
                   ;; logseq file options
                   :<save-logseq-file (fn save-logseq-file [_ path content]
                                        (db-editor-handler/save-file! path content))
                   ;; asset file options
                   :<read-and-copy-asset #(read-and-copy-asset repo (config/get-repo-dir repo) %1 %2 %3)
                   ;; doc file options
                   ;; Write to frontend first as writing to worker first is poor ux with slow streaming changes
                   :<export-file (fn <export-file [conn m opts]
                                   (p/let [tx-reports
                                           (gp-exporter/<add-file-to-db-graph conn (:file/path m) (:file/content m) opts)]
                                     (doseq [tx-report tx-reports]
                                       (db-browser/transact! repo (:tx-data tx-report) (:tx-meta tx-report)))))}
          {:keys [files import-state]} (gp-exporter/export-file-graph repo db-conn config-file *files options)]
    (log/info :import-file-graph {:msg (str "Import finished in " (/ (t/in-millis (t/interval start-time (t/now))) 1000) " seconds")})
    (state/set-state! :graph/importing nil)
    (state/set-state! :graph/importing-state nil)
    (validate-imported-data @db-conn import-state files)
    (state/pub-event! [:graph/ready (state/get-current-repo)])
    (finished-cb)))

(defn import-file-to-db-handler
  "Import from a graph folder as a DB-based graph"
  [ev opts]
  (let [^js file-objs (if ev (array-seq (.-files (.-target ev))) #js [])
        original-graph-name (if (first file-objs)
                              (string/replace (.-webkitRelativePath (first file-objs)) #"/.*" "")
                              "")
        import-graph-fn (or (:import-graph-fn opts)
                            (fn [user-inputs]
                              (let [files (->> file-objs
                                               (map #(hash-map :file-object %
                                                               :path (path/trim-dir-prefix original-graph-name (.-webkitRelativePath %))))
                                               (remove #(and (not (string/starts-with? (:path %) "assets/"))
                                                         ;; TODO: Update this when supporting more formats as this aggressively excludes most formats
                                                             (ignored-path? original-graph-name (.-webkitRelativePath (:file-object %))))))]
                                (if-let [config-file (first (filter #(= (:path %) "logseq/config.edn") files))]
                                  (import-file-graph files user-inputs config-file)
                                  (notification/show! "Import failed as the file 'logseq/config.edn' was not found for a Logseq graph."
                                                      :error)))))]
    (shui/dialog-open!
     #(import-file-graph-dialog original-graph-name
                                (fn [{:keys [graph-name] :as user-inputs}]
                                  (cond
                                    (repo/invalid-graph-name? graph-name)
                                    (repo/invalid-graph-name-warning)

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
  (hooks/use-effect!
   (fn []
     (when (and importing? (not (shui-dialog/get-modal :import-indicator)))
       (shui/dialog-open! indicator-progress
                          {:id :import-indicator
                           :content-props
                           {:onPointerDownOutside #(.preventDefault %)
                            :onOpenAutoFocus #(.preventDefault %)}})))
   [importing?])
  [:<>])

;; Can't name this component as `frontend.components.import` since shadow-cljs
;; will complain about it.
(rum/defc ^:large-vars/cleanup-todo importer < rum/reactive
  [{:keys [query-params]}]
  (let [importing? (state/sub :graph/importing)]
    [:<>
     (import-indicator importing?)
     (when-not importing?
       (setups/setups-container
        :importer
        [:article.flex.flex-col.items-center.importer.py-16.px-8
         (when-not (util/mobile?)
           [:section.c.text-center
            [:h1 (t :on-boarding/importing-title)]
            [:h2 (t :on-boarding/importing-desc)]])
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

          (when-not (util/mobile?)
            [:label.action-input.flex.items-center.mx-2.my-2
             [:span.as-flex-center [:i (svg/logo 28)]]
             [:span.flex.flex-col
              [[:strong "File to DB graph"]
               [:small "Import a file-based Logseq graph folder into a new DB graph"]]]
             ;; Test form style changes
             #_[:a.button {:on-click #(import-file-to-db-handler nil {:import-graph-fn js/alert})} "Open"]
             [:input.absolute.hidden
              {:id "import-file-graph"
               :type "file"
               :webkitdirectory "true"
               :on-change (debounce (fn [e]
                                      (import-file-to-db-handler e {}))
                                    1000)}]])

          [:label.action-input.flex.items-center.mx-2.my-2
           [:span.as-flex-center [:i (svg/logo 28)]]
           [:span.flex.flex-col
            [[:strong "Debug Transit"]
             [:small "Import debug transit file into a new DB graph"]]]
           [:input.absolute.hidden
            {:id "import-debug-transit"
             :type "file"
             :on-change (fn [e]
                          (shui/dialog-open!
                           #(set-graph-name-dialog e {:debug-transit? true})))}]]

          [:label.action-input.flex.items-center.mx-2.my-2
           [:span.as-flex-center [:i (svg/logo 28)]]
           [:span.flex.flex-col
            [[:strong "EDN to DB graph"]
             [:small "Import a DB graph's EDN export into a new DB graph"]]]
           [:input.absolute.hidden
            {:id "import-db-edn"
             :type "file"
             :on-change (fn [e]
                          (shui/dialog-open!
                           #(set-graph-name-dialog e {:db-edn? true})))}]]]

         (when (= "picker" (:from query-params))
           [:section.e
            [:a.button {:on-click #(route-handler/redirect-to-home!)} "Skip"]])]))]))
