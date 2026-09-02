(ns frontend.components.imports
  "Import data into Logseq."
  (:require ["path" :as node-path]
            [cljs-time.core :as t]
            [cljs.pprint :as pprint]
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
            [frontend.persist-db :as persist-db]
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
                            (on-submit-fn (js->clj e :keywordize-keys true))
                            (shui/dialog-close!)))
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
  [{:keys [import-state files validation]}]
  (when-let [org-files (seq (filter #(= "org" (path/file-ext (:path %))) files))]
    (log/info :org-files (mapv :path org-files))
    (notification/show! (t :import/org-files-imported (count org-files))
                        :info false))
  (when-let [ignored-files (seq (:ignored-files import-state))]
    (notification/show! (t :import/ignored-files (count ignored-files))
                        :info false)
    (log/error :import-ignored-files {:msg (str "Import ignored " (count ignored-files) " file(s)")})
    (pprint/pprint ignored-files))
  (when-let [ignored-assets (seq (:ignored-assets import-state))]
    (notification/show! (t :import/ignored-assets (count ignored-assets))
                        :info false)
    (log/error :import-ignored-assets {:msg (str "Import ignored " (count ignored-assets) " asset(s)")})
    (pprint/pprint ignored-assets))
  (when-let [ignored-props (seq (:ignored-properties import-state))]
    (notification/show!
     [:.mb-2
      [:.text-lg.mb-2 (t :import/ignored-properties (count ignored-props))]
      [:span.text-xs
       (t :import/ignored-properties-fix)]
      (->> ignored-props
           (map (fn [{:keys [property value schema location]}]
                  [(str "Property " (pr-str property) " with value " (pr-str value))
                   (if (= property :icon)
                     (if (:page location)
                       (t :import/page-icons-cannot-be-imported (pr-str (:page location)))
                       (t :import/block-icons-cannot-be-imported (pr-str (:block location))))
                     (if (not= (get-in schema [:type :to]) (get-in schema [:type :from]))
                       (t :import/property-type-mismatch (get-in schema [:type :to]) (get-in schema [:type :from]))
                       (t :import/property-import-manually)))]))
           (map (fn [[k v]]
                  [:dl.my-2.mb-0
                   [:dt.m-0 [:strong k]]
                   [:dd {:class "text-warning"} v]])))]
     :warning false))
  (if-let [errors (seq (:errors validation))]
    (do
      (log/error :import-errors {:msg (str "Import detected " (count errors) " invalid block(s):")})
      (pprint/pprint errors)
      (notification/show! (t :import/invalid-blocks-detected (count errors))
                          :warning false))
    (log/info :import-valid {:msg "Valid import!"})))

(defn- show-notification [{:keys [msg level ex-data]}]
  (if (= :error level)
    (do
      (notification/show! msg :error)
      (when ex-data
        (log/error :import-error ex-data)))
    (notification/show! msg :warning false)))

(defn- <serialize-import-file
  [file]
  (let [^js file-object (:file-object file)
        fs-path (some-> (:fs-path file) not-empty)
        file-reference (cond-> (select-keys file [:path :last-modified-at])
                         fs-path (assoc :fs-path fs-path))]
    (if (string/starts-with? (:path file) "assets/")
      (if (assets-handler/exceed-limit-size? file-object)
        (let [path (pr-str (:path file))]
          (log/info :import-asset-skipped-too-large {:msg (t-en :import/asset-too-large-warning path)})
          (notification/show! (t :import/asset-too-large-warning path) :info false)
          (select-keys file [:path]))
        (if fs-path
          (assoc file-reference :asset/size (.-size file-object))
          (p/let [buffer (.arrayBuffer file-object)]
            (assoc file-reference
                   :asset/payload (js/Uint8Array. buffer)
                   :asset/size (.-size file-object)))))
      (if fs-path
        file-reference
        (p/let [content (.text file-object)]
          (assoc file-reference :file/content content))))))

(defn- <serialize-import-files
  [files]
  (p/all (mapv <serialize-import-file files)))

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

(defn- restore-repo-after-import-failure!
  [previous-repo]
  (state/set-current-repo! previous-repo)
  (when previous-repo
    (state/pub-event! [:graph/switch previous-repo {:persist? false}])))

(defn- file-graph-import-retry-delay-ms
  [attempt]
  (min 30000 (* 1000 (js/Math.pow 2 (min (dec attempt) 5)))))

(def ^:private file-graph-import-max-attempts 3)

(defn- <remove-failed-file-graph!
  [repo]
  (if repo
    (-> (persist-db/<wait-for-db-worker-ready! repo)
        (p/catch (fn [_] nil))
        (p/then (fn [_]
                  (repo-handler/remove-repo! {:url repo} :switch-graph? false))))
    (p/resolved nil)))

(defn- <cleanup-failed-file-graph!
  [repo previous-repo]
  (-> (<remove-failed-file-graph! repo)
      (p/then (constantly true))
      (p/catch (fn [error]
                 (log/error :import-file-graph-cleanup-failed
                            {:repo repo
                             :error error})
                 false))
      (p/finally (fn []
                   (restore-repo-after-import-failure! previous-repo)))))

(defn- <invoke-file-graph-import-with-recovery!
  [created-repo graph-name serialized-config-file serialized-files options attempt]
  (reset! created-repo nil)
  (-> (p/let [repo (repo-handler/new-db! graph-name {:file-graph-import? true})
              _ (when-not (string? repo)
                  (throw (ex-info "Failed to create graph for file import"
                                  {:code :file-import-graph-create-failed
                                   :graph-name graph-name})))
              _ (reset! created-repo repo)
              result (state/<invoke-db-worker :thread-api/import-file-graph
                                              repo
                                              serialized-config-file
                                              serialized-files
                                              options)]
        result)
      (p/catch
       (fn [error]
         (let [{:keys [graph-created? repo]} (ex-data error)
               unavailable? (persist-db/db-worker-unavailable-error? error)
               repo (or @created-repo
                        (when (or graph-created? unavailable?) repo))]
           (when repo
             (reset! created-repo repo))
           (if (and repo
                    (< attempt file-graph-import-max-attempts)
                    unavailable?)
             (do
               (log/warn :import-file-graph-retrying
                         {:repo repo
                          :attempt attempt
                          :error error})
               (p/let [_ (<remove-failed-file-graph! repo)
                       _ (p/delay (file-graph-import-retry-delay-ms attempt))]
                 (<invoke-file-graph-import-with-recovery!
                  created-repo
                  graph-name
                  serialized-config-file
                  serialized-files
                  options
                  (inc attempt))))
             (throw error)))))))

(defn- import-file-graph
  [*files
   {:keys [graph-name] :as user-options}
   config-file]
  (let [previous-repo (state/get-current-repo)
        created-repo (atom nil)]
    (state/set-state! :graph/importing :file-graph)
    (state/set-state! [:graph/importing-state :current-page] "Config files")
    (-> (p/let [start-time (t/now)
                serialized-files (<serialize-import-files *files)
                serialized-config-file (first (filter #(= (:path %) (:path config-file)) serialized-files))
                options (build-file-graph-worker-options user-options config/config-default-content)
                import-result (<invoke-file-graph-import-with-recovery!
                               created-repo
                               graph-name
                               serialized-config-file
                               serialized-files
                               options
                               1)
                _ (doseq [notification (:notifications import-result)]
                    (show-notification notification))]
          (log/info :import-file-graph {:msg (str "Import finished in " (/ (t/in-millis (t/interval start-time (t/now))) 1000) " seconds")})
          (validate-imported-data import-result)
          (state/pub-event! [:graph/ready (state/get-current-repo)])
          (finished-cb))
        (p/catch (fn [error]
                   (log/error :import-file-graph-failed
                              {:repo @created-repo
                               :error error})
                   (p/let [cleanup-succeeded? (<cleanup-failed-file-graph! @created-repo previous-repo)]
                     (notification/show! (t (if cleanup-succeeded?
                                              :import/file-failed
                                              :import/file-failed-cleanup))
                                         :error)
                     (throw error))))
        (p/finally (fn []
                     (state/set-state! :graph/importing nil)
                     (state/set-state! :graph/importing-state nil)
                     (shui/dialog-close! :import-indicator))))))

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
                                                                          (some-> (js/window.apis.getFilePath %)
                                                                                  not-empty))
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
  (let [{:keys [total current-idx current-page label]} (rfx/use-sub [:graph/importing-state])
        label (or label (t :import/loading))
        left-label (if (and current-idx total (= current-idx total))
                     [:div.flex.flex-row.font-bold (t :ui/loading)]
                     [:div.flex.flex-row.font-bold
                      label
                      [:div.hidden.md:flex.flex-row
                       [:span.mr-1 ": "]
                       [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                        current-page]]])
        width (js/Math.round (* (.toFixed (/ current-idx total) 2) 100))
        process (when (and total current-idx)
                  (str current-idx "/" total))]
    [:div.p-5
     (ui/progress-bar-with-label width left-label process)]))

(hsx/defc import-indicator
  [importing?]
  (hooks/use-effect!
   (fn []
     (when (and importing? (not (shui-dialog/get-dialog :import-indicator)))
       (shui/dialog-open! indicator-progress
                          {:id :import-indicator
                           :content-props
                           {:onPointerDownOutside #(.preventDefault %)
                            :onOpenAutoFocus #(.preventDefault %)}})))
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
