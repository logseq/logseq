(ns frontend.components.imports
  "Import data into Logseq."
  (:require ["path" :as node-path]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.components.onboarding.setups :as setups]
            [frontend.components.repo :as repo]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t t-en]]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.db-based.import :as db-import-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [lambdaisland.glogi :as log]
            [logseq.common.path :as path]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.form.core :as form-core]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

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
  [& {:keys [reload?]
      :or {reload? true}}]
  (state/pub-event! [:graph/sync-context])
  (notification/show! (t :import/file-finished) :success)
  (shui/dialog-close! :import-indicator)
  (route-handler/redirect-to-home!)
  (if util/web-platform?
    (if reload?
      (js/window.location.reload)
      (js/setTimeout ui-handler/re-render-root! 500))
    (js/setTimeout ui-handler/re-render-root! 500)))

(defn- lsq-import-handler
  [e & {:keys [sqlite? sqlite-zip? debug-transit? graph-name db-edn?]}]
  (let [file      (first (array-seq (.-files (.-target e))))]
    (cond
      sqlite?
      (let [graph-name (string/trim graph-name)]
        (cond
          (string/blank? graph-name)
          (notification/show! (t :import/empty-graph-name) :error)

          (repo-handler/graph-already-exists? graph-name)
          (notification/show! (t :import/graph-name-conflict) :error)

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

      sqlite-zip?
      (let [graph-name (string/trim graph-name)]
        (cond
          (string/blank? graph-name)
          (notification/show! (t :import/empty-graph-name) :error)

          (repo-handler/graph-already-exists? graph-name)
          (notification/show! (t :import/graph-name-conflict) :error)

          :else
          (db-import-handler/import-from-sqlite-zip! file graph-name
                                                     (fn []
                                                       (finished-cb {:reload? false})))))

      (or debug-transit? db-edn?)
      (let [graph-name (string/trim graph-name)]
        (cond
          (string/blank? graph-name)
          (notification/show! (t :import/empty-graph-name) :error)

          (repo-handler/graph-already-exists? graph-name)
          (notification/show! (t :import/graph-name-conflict) :error)

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
      (notification/show! (t :import/select-edn-or-json)
                          :error))))

(hsx/defc set-graph-name-dialog
  [input-e opts]
  (let [[input set-input!] (hooks/use-state "")
        on-submit #(if (repo/invalid-graph-name? input)
                     (repo/invalid-graph-name-warning)
                     (lsq-import-handler input-e (assoc opts :graph-name input)))]
    [:div.container
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium.pb-2
        (t :import/new-graph-name)]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2.mb-4
       {:auto-focus true
       :on-change (fn [e]
                    (set-input! (util/evalue e)))
       :on-key-down (fn [e]
                      (when (= "Enter" (util/ekey e))
                        (on-submit)))}]

     [:div.mt-5.sm:mt-4.flex
      (ui/button (t :ui/submit)
                 {:on-click on-submit})]]))

(hsx/defc import-file-graph-dialog
  [initial-name on-submit-fn]
  [:div.border.p-6.rounded.bg-gray-01.mt-4
   (let [form-ctx (form-core/use-form
                   {:defaultValues {:graph-name initial-name
                                    :extract-code-snippets? false
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
                            (shui/dialog-close!)
                            (on-submit-fn (js->clj e :keywordize-keys true))))
         [convert-all-tags-input set-convert-all-tags-input!] (hooks/use-state true)]

     (shui/form-provider form-ctx
                         [:form
                          {:on-submit on-submit-valid}

                          (shui/form-field {:name "graph-name"}
                                           (fn [field error]
                                             (shui/form-item
                                              (shui/form-label (t :import/new-graph-name))
                                              (shui/form-control
                                               (shui/input (merge {:placeholder (t :import/graph-name-placeholder)} field)))
                                              (when error
                                                (shui/form-description
                                                 [:b.text-red-800 (:message error)])))))

                          (shui/form-field {:name "extract-code-snippets?"}
                                           (fn [field]
                                             (shui/form-item
                                              {:class "pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
                                              (shui/form-label (t :import/extract-inline-code-snippets))
                                              (shui/form-control
                                               (shui/checkbox {:checked (:value field)
                                                               :on-checked-change (:onChange field)})))))

                          (shui/form-field {:name "convert-all-tags?"}
                                           (fn [field]
                                             (shui/form-item
                                              {:class "pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
                                              (shui/form-label (t :import/all-tags))
                                              (shui/form-control
                                               (shui/checkbox {:checked (:value field)
                                                               :on-checked-change (fn [e]
                                                                                    ((:onChange field) e)
                                                                                    (set-convert-all-tags-input! (not convert-all-tags-input)))})))))

                          (shui/form-field {:name "tag-classes"}
                                           (fn [field _error]
                                             (shui/form-item
                                              {:class "pt-3"}
                                              (shui/form-label (t :import/specific-tags))
                                              (shui/form-control
                                               (shui/input (merge field
                                                                  {:placeholder (t :import/tag-classes-placeholder) :disabled convert-all-tags-input})))
                                              (shui/form-description (t :import/tags-case-insensitive)))))

                          (shui/form-field {:name "remove-inline-tags?"}
                                           (fn [field]
                                             (shui/form-item
                                              {:class "pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
                                              (shui/form-label (t :import/remove-inline-tags))
                                              (shui/form-description (t :import/default-db-graph-behavior))
                                              (shui/form-control
                                               (shui/checkbox {:checked (:value field)
                                                               :on-checked-change (:onChange field)})))))

                          (shui/form-field {:name "property-classes"}
                                           (fn [field _error]
                                             (shui/form-item
                                              {:class "pt-3"}
                                              (shui/form-label (t :import/property-value-tags))
                                              (shui/form-control
                                               (shui/input (merge {:placeholder (t :import/property-classes-placeholder)} field)))
                                              (shui/form-description
                                               (t :import/properties-case-insensitive-commas)))))

                          (shui/form-field {:name "property-parent-classes"}
                                           (fn [field _error]
                                             (shui/form-item
                                              {:class "pt-3"}
                                              (shui/form-label (t :import/property-value-tag-parents))
                                              (shui/form-control
                                               (shui/input (merge {:placeholder (t :import/property-parent-classes-placeholder)} field)))
                                              (shui/form-description
                                               (t :import/properties-case-insensitive-commas)))))

                          (shui/button {:type "submit" :class "right-0 mt-3"} (t :ui/submit))]))])

(defn- validate-imported-data
  [{:keys [org-file-count ignored-files-count ignored-assets-count ignored-properties-count validation-error-count]}]
  (when (pos? (or org-file-count 0))
    (notification/show! (t :import/org-files-imported org-file-count)
                        :info false))
  (when (pos? (or ignored-files-count 0))
    (notification/show! (t :import/ignored-files ignored-files-count)
                        :info false))
  (when (pos? (or ignored-assets-count 0))
    (notification/show! (t :import/ignored-assets ignored-assets-count)
                        :info false))
  (when (pos? (or ignored-properties-count 0))
    (notification/show!
     [:.mb-2
      [:.text-lg.mb-2 (t :import/ignored-properties ignored-properties-count)]
      [:span.text-xs
       (t :import/ignored-properties-fix)]]
     :warning false))
  (if (pos? (or validation-error-count 0))
    (notification/show! (t :import/invalid-blocks-detected validation-error-count)
                        :warning false)
    (log/info :import-valid {:msg "Valid import!"})))

(defn- show-notification [{:keys [msg level ex-data]}]
  (if (= :error level)
    (do
      (notification/show! msg :error)
      (when ex-data
        (log/error :import-error ex-data)))
    (notification/show! msg :warning false)))

(defn- electron-lazy-import?
  [files]
  (and (util/electron?)
       (boolean (some :fs-path files))))

(defn- import-file-descriptor
  [file]
  (select-keys file [:path :fs-path :last-modified-at]))

(defn- <serialize-import-file
  [file]
  (let [^js file-object (:file-object file)]
    (if (string/starts-with? (:path file) "assets/")
      (if (assets-handler/exceed-limit-size? file-object)
        (let [path (pr-str (:path file))]
          (log/info :import-asset-skipped-too-large {:msg (t-en :import/asset-too-large-warning path)})
          (notification/show! (t :import/asset-too-large-warning path) :info false)
          (p/resolved (select-keys file [:path :fs-path])))
        (p/let [buffer (.arrayBuffer file-object)]
          (p/resolved (assoc (select-keys file [:path :fs-path])
                             :asset/payload (js/Uint8Array. buffer)
                             :asset/size (.-size file-object)))))
      (p/let [content (.text file-object)]
        (p/resolved (assoc (select-keys file [:path :fs-path])
                           :file/content content))))))

(defn- <prepare-import-files
  [files]
  (if (electron-lazy-import? files)
    (p/resolved (mapv import-file-descriptor files))
    (p/all (mapv <serialize-import-file files))))

(defn- <serialize-import-files
  [files]
  (<prepare-import-files files))

(defn build-file-graph-worker-options
  [{:keys [tag-classes property-classes property-parent-classes] :as user-options}
   default-config]
  {:user-options
   (merge
    (dissoc user-options :graph-name)
    {:tag-classes (some-> tag-classes string/trim not-empty (string/split #",\s*") set)
     :property-classes (some-> property-classes string/trim not-empty (string/split #",\s*") set)
     :property-parent-classes (some-> property-parent-classes string/trim not-empty (string/split #",\s*") set)})
   :default-config default-config})

(def ^:private file-graph-import-initial-ui-state
  {:step :importing
   :label :import/loading
   :current-idx 0})

(declare ^:private open-import-indicator!)

(defn- clear-file-graph-importing-ui!
  []
  (state/set-state! :graph/importing nil)
  (state/set-state! :graph/importing-state nil)
  (state/set-state! :graph/importing-result nil)
  (shui/dialog-close! :import-indicator))

(defn- start-imported-graph-search-index!
  [repo]
  (state/<invoke-db-worker :thread-api/search-build-blocks-indice-in-worker repo)
  nil)

(defn- finish-file-graph-import!
  [repo import-result]
  (clear-file-graph-importing-ui!)
  (doseq [notification (:notifications import-result)]
    (show-notification notification))
  (validate-imported-data import-result)
  (notification/show! (t :import/file-finished) :success)
  (state/pub-event! [:graph/sync-context])
  (state/pub-event! [:graph/ready repo])
  (route-handler/redirect-to-home!)
  (ui-handler/re-render-root!)
  (start-imported-graph-search-index! repo)
  nil)

(defn- transport-error?
  [error]
  (let [message (or (.-message error) (str error))
        code (:code (ex-data error))]
    (or (nil? (ex-data error))
        (contains? #{:fetch-failed :network-error :db-worker-unavailable :server-unavailable} code)
        (and (string? message)
             (string/includes? message "Failed to fetch")))))

(defn- import-files-finished?
  []
  (let [{:keys [total current-idx step]} (state/get-state :graph/importing-state)]
    (or (some? (state/get-state :graph/importing-result))
        (contains? #{:finishing :validating} step)
        (and (number? total) (pos? total)
             (number? current-idx)
             (>= current-idx total)))))

(defn- abort-file-graph-import!
  [error previous-repo]
  (log/error :import-file-graph-failed {:error error})
  (let [current-repo (state/get-current-repo)
        created-new-graph? (and previous-repo
                                (not= previous-repo current-repo))
        keep-imported-graph? (and created-new-graph?
                                  (transport-error? error)
                                  (import-files-finished?))]
    (if keep-imported-graph?
      (let [import-result (or (state/get-state :graph/importing-result) {})]
        (p/let [_ (repo-handler/restore-and-setup-repo! current-repo {:file-graph-import? true})]
          (finish-file-graph-import! current-repo import-result)))
      (do
        (clear-file-graph-importing-ui!)
        (when created-new-graph?
          (notification/show! (t :import/unexpected-error
                                 (or (.-message error) (str error)))
                              :error)
          (state/pub-event! [:graph/switch previous-repo {:persist? false}]))
        (when (and (not created-new-graph?)
                   (= :file-graph-import/graph-not-created (:code (ex-data error))))
          (notification/show! (t :import/unexpected-error
                                 (or (.-message error) (str error)))
                              :error))
        nil))))

(defn- import-file-graph
  [*files
   {:keys [graph-name] :as user-options}
   config-file]
  (let [previous-repo (state/get-current-repo)
        expected-repo (str config/db-version-prefix graph-name)]
    (state/set-state! :graph/importing :file-graph)
    (state/set-state! :graph/importing-state file-graph-import-initial-ui-state)
    (open-import-indicator!)
    (-> (p/let [start-time (t/now)
                created-repo (repo-handler/new-db! graph-name {:file-graph-import? true})
                repo (or created-repo (state/get-current-repo))]
          (when-not (= repo expected-repo)
            (throw (ex-info "File-graph import did not create a new graph"
                            {:code :file-graph-import/graph-not-created
                             :expected expected-repo
                             :repo repo})))
          (p/let [serialized-files (<serialize-import-files *files)
                  serialized-config-file (first (filter #(= (:path %) (:path config-file)) serialized-files))
                  options (build-file-graph-worker-options user-options config/config-default-content)
                  _ (state/<invoke-db-worker :thread-api/import-file-graph repo serialized-config-file serialized-files options)
                  import-result (or (state/get-state :graph/importing-result) {})
                  ;; Import txs do not broadcast renderer deltas. Restore after
                  ;; import so this client sees pages and refs. Keep importing
                  ;; set so :graph/restored does not start a second search build.
                  _ (repo-handler/restore-and-setup-repo! repo {:file-graph-import? true})]
            (log/info :import-file-graph {:msg (str "Import finished in " (/ (t/in-millis (t/interval start-time (t/now))) 1000) " seconds")})
            (finish-file-graph-import! repo import-result)))
        (p/catch (fn [error]
                   (abort-file-graph-import! error previous-repo))))))

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
                                                               :path (path/trim-dir-prefix original-graph-name (.-webkitRelativePath %))
                                                               :fs-path (when (util/electron?)
                                                                          (js/window.apis.getFilePath %))
                                                               :last-modified-at (some-> (.-lastModified %) js/Date.)))
                                               (remove #(and (not (string/starts-with? (:path %) "assets/"))
                                                         ;; TODO: Update this when supporting more formats as this aggressively excludes most formats
                                                             (ignored-path? original-graph-name (.-webkitRelativePath (:file-object %))))))]
                                (if-let [config-file (first (filter #(= (:path %) "logseq/config.edn") files))]
                                  (import-file-graph files user-inputs config-file)
                                  (notification/show! (t :import/logseq-config-missing)
                                                      :error)))))]
    (shui/dialog-open!
     #(import-file-graph-dialog original-graph-name
                                (fn [{:keys [graph-name] :as user-inputs}]
                                  (cond
                                    (repo/invalid-graph-name? graph-name)
                                    (repo/invalid-graph-name-warning)

                                    (repo-handler/graph-already-exists? graph-name)
                                    (notification/show! (t :import/graph-name-conflict) :error)

                                    :else
                                    (import-graph-fn user-inputs)))))))

(hsx/defc indicator-progress
  []
  (let [{:keys [total current-idx current-page label step]} (rfx/use-sub [:graph/importing-state])
        label (or (case step
                    (:importing :config :pages) (t :import/loading)
                    :assets (t :import/copying-assets)
                    :finishing (t :import/finishing)
                    :validating (t :import/validating-graph)
                    nil)
                  (when (keyword? label) (t label))
                  (when (seq label) label)
                  (t :import/loading))
        left-label [:div.flex.flex-row.font-bold
                    label
                    (when (seq current-page)
                      [:div.hidden.md:flex.flex-row
                       [:span.mr-1 ": "]
                       [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                        current-page]])]
        width (when (and total current-idx (pos? total))
                (js/Math.round (* (.toFixed (/ current-idx total) 2) 100)))
        process (when (and total current-idx)
                  (str current-idx "/" total))]
    [:div.p-5
     (ui/progress-bar-with-label (or width 0) left-label process)]))

(defn- open-import-indicator!
  []
  (when-not (shui-dialog/get-dialog :import-indicator)
    (shui/dialog-open! indicator-progress
                       {:id :import-indicator
                        :content-props
                        {:onPointerDownOutside #(.preventDefault %)
                         :onOpenAutoFocus #(.preventDefault %)}})))

(hsx/defc import-indicator
  [importing?]
  (hooks/use-effect!
   (fn []
     (when importing?
       (open-import-indicator!)))
   [importing?])
  [:<>])

;; Can't name this component as `frontend.components.import` since shadow-cljs
;; will complain about it.
(hsx/defc ^:large-vars/cleanup-todo importer
  [{:keys [query-params]}]
  (let [importing? (rfx/use-sub [:graph/importing])]
    [:<>
     (import-indicator importing?)
     (when-not importing?
       (setups/setups-container
        :importer
        [:article.flex.flex-col.items-center.importer.py-16.px-8
         (when-not (util/mobile?)
           [:section.c.text-center
            [:h1 (t :onboarding.import/title)]
            [:h2 (t :onboarding.import/desc)]])
         [:section.d.md:flex.flex-col
          [:label.action-input.flex.items-center.mx-2.my-2
           [:span.as-flex-center [:i (svg/logo 28)]]
           [:span.flex.flex-col
            [:strong "SQLite"]
            [:small (t :onboarding.import/sqlite-desc)]]
           [:input.absolute.hidden
            {:id "import-sqlite-db"
             :type "file"
             :on-change (fn [e]
                          (shui/dialog-open!
                           #(set-graph-name-dialog e {:sqlite? true})))}]]

          [:label.action-input.flex.items-center.mx-2.my-2
           [:span.as-flex-center [:i (svg/logo 28)]]
           [:span.flex.flex-col
            [:strong (t :import/sqlite-and-assets-title)]
            [:small (t :import/sqlite-and-assets-desc)]]
           [:input.absolute.hidden
            {:id "import-sqlite-zip"
             :type "file"
             :accept ".zip"
             :on-change (fn [e]
                          (shui/dialog-open!
                           #(set-graph-name-dialog e {:sqlite-zip? true})))}]]

          (when-not (util/mobile?)
            [:label.action-input.flex.items-center.mx-2.my-2
             [:span.as-flex-center [:i (svg/logo 28)]]
             [:span.flex.flex-col
              [:strong (t :import/file-to-db-title)]
              [:small (t :import/file-to-db-desc)]]
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
            [:strong (t :import/debug-transit-title)]
            [:small (t :import/debug-transit-desc)]]
           [:input.absolute.hidden
            {:id "import-debug-transit"
             :type "file"
             :on-change (fn [e]
                          (shui/dialog-open!
                           #(set-graph-name-dialog e {:debug-transit? true})))}]]

          [:label.action-input.flex.items-center.mx-2.my-2
           [:span.as-flex-center [:i (svg/logo 28)]]
           [:span.flex.flex-col
            [:strong (t :import/db-edn-title)]
            [:small (t :import/db-edn-desc)]]
           [:input.absolute.hidden
            {:id "import-db-edn"
             :type "file"
             :on-change (fn [e]
                          (shui/dialog-open!
                           #(set-graph-name-dialog e {:db-edn? true})))}]]]

         (when (= "picker" (:from query-params))
           [:section.e
            [:a.button {:on-click #(route-handler/redirect-to-home!)} (t :ui/skip)]])]))]))
