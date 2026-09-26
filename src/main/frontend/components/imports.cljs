(ns frontend.components.imports
  "Import data into Logseq."
  (:require ["path" :as node-path]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.components.onboarding.setups :as setups]
            [frontend.components.repo :as repo]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t t-en]]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.db-based.import :as db-import-handler]
            [frontend.handler.file-graph-import :as file-graph-import]
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
            [logseq.common.util :as common-util]
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

(defn- import-checkbox-field
  [name label description extra-on-change]
  (shui/form-field {:name name}
                   (fn [field]
                     (shui/form-item
                      {:class "pt-3 flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
                      (shui/form-label label)
                      (when description
                        (shui/form-description description))
                      (shui/form-control
                       (shui/checkbox {:checked (:value field)
                                       :on-checked-change (fn [e]
                                                            ((:onChange field) e)
                                                            (when extra-on-change (extra-on-change e)))}))))))

(hsx/defc import-file-graph-dialog
  [initial-name on-submit-fn {:keys [plain-markdown?]}]
  [:div.border.p-6.rounded.bg-gray-01.mt-4
   (when plain-markdown?
     [:p.text-sm.text-muted-foreground.pb-2
      (t :import/plain-markdown-notice)])
   (let [form-ctx (form-core/use-form
                   {:defaultValues {:graph-name initial-name
                                    :extract-code-snippets? false
                                    :convert-all-tags? false
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
         [convert-all-tags-input set-convert-all-tags-input!] (hooks/use-state false)]

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

                          (import-checkbox-field "extract-code-snippets?"
                                                 (t :import/extract-inline-code-snippets)
                                                 (t :import/extract-inline-code-snippets-desc)
                                                 nil)

                          (import-checkbox-field "convert-all-tags?"
                                                 (t :import/all-tags)
                                                 (t :import/all-tags-desc)
                                                 (fn [_]
                                                   (set-convert-all-tags-input! (not convert-all-tags-input))))

                          (shui/form-field {:name "tag-classes"}
                                           (fn [field _error]
                                             (shui/form-item
                                              {:class "pt-3"}
                                              (shui/form-label (t :import/specific-tags))
                                              (shui/form-control
                                               (shui/input (merge field
                                                                  {:placeholder (t :import/tag-classes-placeholder) :disabled convert-all-tags-input})))
                                              (shui/form-description (t :import/tags-case-insensitive)))))

                          (import-checkbox-field "remove-inline-tags?"
                                                 (t :import/remove-inline-tags)
                                                 (t :import/default-db-graph-behavior)
                                                 nil)

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

;; Ignored items and validation errors are reported by the import report
;; dialog; this only covers org files, which are not part of that report.
(defn- validate-imported-data
  [{:keys [org-file-count]}]
  (when (pos? (or org-file-count 0))
    (notification/show! (t :import/org-files-imported org-file-count)
                        :info false))
  (log/info :import-valid {:msg "Valid import!"}))

;;; import report

(defn- import-location-text
  [location]
  (cond
    (map? location) (or (:page location) (:block location) (pr-str location))
    (nil? location) nil
    :else (str location)))

(defn- import-reason-text
  [reason]
  (let [reason-key (some-> reason str (string/replace #"^:" ""))]
    (case reason-key
      "export-failed" (t :import.reason/export-failed)
      "unsupported-file-format" (t :import.reason/unsupported-file-format)
      "whiteboard-not-supported" (t :import.reason/whiteboard-not-supported)
      "skipped-by-file-picker" (t :import.reason/skipped-by-file-picker)
      "alias/self" (t :import.reason/alias-conflict)
      "alias/source-is-alias" (t :import.reason/alias-conflict)
      "alias/duplicate-owner" (t :import.reason/alias-conflict)
      "alias/alias-owns-aliases" (t :import.reason/alias-conflict)
      "No asset data found for this asset path" (t :import.reason/missing-asset-data)
      "Some asset links were not updated to block references" (t :import.reason/asset-links-not-updated)
      (str reason))))

(defn- import-report-items-md
  [items render-item]
  (->> items (map render-item) (map #(str "- " %)) (string/join "\n")))

(defn- ignored-item-md
  [item]
  (str "`" (:path item) "`"
       (when-let [reason (:reason item)]
         (str " — " (import-reason-text reason)))))

(defn- ignored-property-md
  [{:keys [property location reason schema]}]
  (str "`" (name property) "`"
       (when-let [location' (import-location-text location)]
         (str " — " location'))
       (when reason
         (str " (" (import-reason-text reason) ")"))
       (when schema
         (str " schema: " schema))))

(defn- validation-error-md
  [{:keys [title page dispatch-key errors]}]
  (str title
       (when page (str " @" page))
       (when dispatch-key (str " [" (name dispatch-key) "]"))
       " — " errors))

(defn- build-import-report-md
  [{:keys [ignored-files-detail ignored-assets-detail ignored-properties-detail
           validation-errors-detail notifications]}]
  (str "# " (t :import/report-title) "\n\n"
       (when (seq ignored-files-detail)
         (str "## " (t :import/report-ignored-files) "\n\n"
              (import-report-items-md ignored-files-detail ignored-item-md) "\n\n"))
       (when (seq ignored-assets-detail)
         (str "## " (t :import/report-ignored-assets) "\n\n"
              (import-report-items-md ignored-assets-detail ignored-item-md) "\n\n"))
       (when (seq ignored-properties-detail)
         (str "## " (t :import/report-ignored-properties) "\n\n"
              (import-report-items-md ignored-properties-detail ignored-property-md) "\n\n"))
       (when (seq validation-errors-detail)
         (str "## " (t :import/report-validation-errors) "\n\n"
              (import-report-items-md validation-errors-detail validation-error-md) "\n\n"))
       (when (seq notifications)
         (str "## " (t :import/report-errors) "\n\n"
              (import-report-items-md notifications :msg) "\n\n"))))

(defn- download-text-file!
  [file-name text]
  (let [blob (js/Blob. #js [text] #js {:type "text/markdown"})
        url (js/URL.createObjectURL blob)
        anchor (js/document.createElement "a")]
    (set! (.-href anchor) url)
    (set! (.-download anchor) file-name)
    (.click anchor)
    (js/URL.revokeObjectURL url)))

(def ^:private import-report-render-limit 200)

(defn- import-report-section
  "Renders up to `import-report-render-limit` items; the full list is in the
  downloaded report."
  [title items render-item]
  (when (seq items)
    [:section.mb-4
     [:h3.font-medium.mb-1 title]
     [:ul.list-disc.pl-5.text-sm.flex.flex-col.gap-1
      (map-indexed (fn [idx item]
                     [:li {:key idx} (render-item item)])
                   (take import-report-render-limit items))]
     (when (> (count items) import-report-render-limit)
       [:p.text-xs.text-muted-foreground.mt-1
        (t :import/report-truncated import-report-render-limit (count items))])]))

(defn- ignored-file-item-view
  [{:keys [path reason]}]
  [:span
   [:code path]
   (when reason (str " — " (import-reason-text reason)))])

(defn- ignored-property-item-view
  [{:keys [property location reason schema]}]
  [:span
   [:code (name property)]
   (when-let [location' (import-location-text location)]
     (str " — " location'))
   (when reason (str " (" (import-reason-text reason) ")"))
   (when schema (str " " schema))])

(defn- validation-error-item-view
  [{:keys [title page dispatch-key errors]}]
  [:span
   [:code title]
   (when page (str " @" page))
   (when dispatch-key (str " [" (name dispatch-key) "]"))
   (str " — " errors)])

(defn- notification-item-view
  [{:keys [msg]}]
  [:span msg])

(hsx/defc import-report-dialog
  [import-result]
  (let [{:keys [ignored-files-detail ignored-assets-detail ignored-properties-detail
                validation-errors-detail notifications]} import-result]
    [:div.container
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium.pb-2
        (t :import/report-title)]]]
     [:div.max-h-96.overflow-y-auto.pr-1
      (import-report-section (t :import/report-ignored-files)
                             ignored-files-detail
                             ignored-file-item-view)
      (import-report-section (t :import/report-ignored-assets)
                             ignored-assets-detail
                             ignored-file-item-view)
      (import-report-section (t :import/report-ignored-properties)
                             ignored-properties-detail
                             ignored-property-item-view)
      (import-report-section (t :import/report-validation-errors)
                             validation-errors-detail
                             validation-error-item-view)
      (import-report-section (t :import/report-errors)
                             notifications
                             notification-item-view)]
     [:div.mt-5.sm:mt-4.flex.gap-2
      (ui/button (t :import/report-download)
                 {:on-click #(download-text-file! "logseq-import-report.md"
                                                  (build-import-report-md import-result))})
      (ui/button (t :ui/close)
                 {:on-click #(shui/dialog-close!)})]]))

(defn- import-report-needed?
  [{:keys [ignored-files-count ignored-assets-count ignored-properties-count validation-error-count
           ignored-files-detail ignored-assets-detail ignored-properties-detail
           validation-errors-detail notifications]}]
  (boolean (or (seq ignored-files-detail) (seq ignored-assets-detail)
               (seq ignored-properties-detail) (seq validation-errors-detail)
               (seq notifications)
               (pos? (or ignored-files-count 0)) (pos? (or ignored-assets-count 0))
               (pos? (or ignored-properties-count 0)) (pos? (or validation-error-count 0)))))

(defn- open-import-report!
  [import-result]
  (shui/dialog-open!
   #(import-report-dialog import-result)
   {:id :import-report
    :content-props {:class "w-auto md:max-w-2xl max-h-[80vh] overflow-y-auto"}}))

;;; dry-run scan

(hsx/defc scanning-dialog
  []
  (let [{:keys [total current-idx current-page]} (rfx/use-sub [:graph/importing-state])
        width (when (and total current-idx (pos? total))
                (js/Math.round (* (.toFixed (/ current-idx total) 2) 100)))
        process (when (and total current-idx)
                  (str current-idx "/" total))]
    [:div.p-5
     (ui/progress-bar-with-label (or width 0)
                                 [:div.flex.flex-row.font-bold
                                  (t :import/scanning)
                                  (when (seq current-page)
                                    [:div.hidden.md:flex.flex-row
                                     [:span.mr-1 ": "]
                                     [:div.text-ellipsis-wrapper {:style {:max-width 300}}
                                      current-page]])]
                                 process)]))

(defn- open-scan-dialog!
  []
  (shui/dialog-open! scanning-dialog
                     {:id :import-scan
                      :content-props
                      {:onPointerDownOutside #(.preventDefault %)
                       :onOpenAutoFocus #(.preventDefault %)}}))

(defn- close-scan-dialog!
  []
  (state/set-state! :graph/importing-state nil)
  (shui/dialog-close! :import-scan))

(hsx/defc import-scan-preview-dialog
  [scan-result on-import]
  (let [{:keys [page-count journal-count block-count org-file-count
                ignored-files-detail ignored-assets-detail ignored-properties-detail
                validation-errors-detail notifications]} (or scan-result {})]
    [:div.container
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.leading-6.font-medium.pb-2
        (t :import/scan-title)]]]
     [:div.max-h-96.overflow-y-auto.pr-1
      (when (or page-count block-count)
        [:p.text-sm.mb-2
         (t :import/scan-summary (or page-count 0) (or block-count 0) (or journal-count 0))])
      (when (pos? (or org-file-count 0))
        [:p.text-sm.mb-2 (t :import/scan-org-notice org-file-count)])
      (when (and (empty? ignored-files-detail) (empty? ignored-assets-detail)
                 (empty? ignored-properties-detail) (empty? validation-errors-detail)
                 (empty? notifications))
        [:p.text-sm.text-muted-foreground (t :import/scan-empty)])
      (import-report-section (t :import/report-ignored-files)
                             ignored-files-detail
                             ignored-file-item-view)
      (import-report-section (t :import/report-ignored-assets)
                             ignored-assets-detail
                             ignored-file-item-view)
      (import-report-section (t :import/report-ignored-properties)
                             ignored-properties-detail
                             ignored-property-item-view)
      (import-report-section (t :import/report-validation-errors)
                             validation-errors-detail
                             validation-error-item-view)
      (import-report-section (t :import/report-errors)
                             notifications
                             notification-item-view)]
     [:div.mt-5.sm:mt-4.flex.gap-2
      (ui/button (t :import/title)
                 {:on-click on-import})
      (ui/button (t :ui/cancel)
                 {:on-click #(shui/dialog-close!)})]]))

(defn- <confirm-import-scan!
  "Opens the scan preview dialog. Resolves true when the user picks Import and
  false on any other close."
  [scan-result]
  (p/create
   (fn [resolve _reject]
     (shui/dialog-open!
      #(import-scan-preview-dialog scan-result
                                   (fn []
                                     (resolve true)
                                     (shui/dialog-close! :import-scan-preview)))
      {:id :import-scan-preview
       :on-close (fn [_] (resolve false))
       :content-props {:class "w-auto md:max-w-2xl max-h-[80vh] overflow-y-auto"}}))))

(defn- show-notification [{:keys [msg level ex-data]}]
  (if (= :error level)
    (do
      (notification/show! msg :error)
      (when ex-data
        (log/error :import-error ex-data)))
    (notification/show! msg :warning false)))

(defn- import-file-descriptor
  [file]
  (select-keys file [:path :fs-path :last-modified-at]))

(defn- import-files-by-path
  [files]
  (into {}
        (keep (fn [file]
                (when-let [path (:path file)]
                  [path file])))
        files))

(defn- <file-timestamps
  "Prefer birthtime when present. Fall back to mtime / File.lastModified."
  [{:keys [fs-path last-modified-at]}]
  (p/let [stat (when (and fs-path (util/electron?) (path/absolute? fs-path))
                  (p/catch (ipc/ipc :stat fs-path)
                           (fn [error]
                             (log/warn :import-file-stat-failed {:path fs-path :error error})
                             nil)))
          updated-at (common-util/timestamp-ms (or (:mtime stat) last-modified-at))
          created-at (or (common-util/timestamp-ms (:birthtime stat))
                         updated-at)]
    (cond-> {}
      created-at
      (assoc :file-created-at created-at)
      updated-at
      (assoc :file-updated-at updated-at))))

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
      (p/let [content (.text file-object)
              timestamps (<file-timestamps file)]
        (p/resolved (merge (select-keys file [:path :fs-path])
                           timestamps
                           {:file/content content}))))))

(defn- start-file-graph-import-session!
  [files]
  (let [files-by-path (import-files-by-path files)]
    (file-graph-import/set-file-graph-import-session!
     {:<read-file (fn [path]
                    (if-let [file (get files-by-path path)]
                      (<serialize-import-file file)
                      (p/rejected (ex-info "import file not found"
                                           {:code :import-file-not-found
                                            :path path}))))})))

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
  (shui/dialog-close! :import-scan)
  (shui/dialog-close! :import-scan-preview)
  (shui/dialog-close! :import-indicator))

(defn- start-imported-graph-search-index!
  [repo]
  (state/<invoke-db-worker :thread-api/search-build-blocks-indice-in-worker repo)
  nil)

(defn- finish-file-graph-import!
  [repo import-result client-ignored-files]
  (clear-file-graph-importing-ui!)
  (let [client-ignored (->> client-ignored-files
                            (map #(assoc % :reason :skipped-by-file-picker))
                            vec)
        import-result (cond-> import-result
                        (seq client-ignored)
                        (-> (update :ignored-files-detail into client-ignored)
                            (update :ignored-files-count (fnil + 0) (count client-ignored))))]
    (when (seq import-result)
      (doseq [notification (:notifications import-result)]
        (show-notification notification))
      (validate-imported-data import-result)
      (when (import-report-needed? import-result)
        (open-import-report! import-result))))
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
    (or (contains? #{:fetch-failed :network-error :db-worker-unavailable :server-unavailable} code)
        (and (string? message)
             (string/includes? message "Failed to fetch")))))

(defn- import-files-finished?
  "Keep-graph is safe only after export-file-graph returns (sqlite store +
  finalize). :finishing is set before those steps; current-idx reaches total
  when the last file starts."
  []
  (= :validating (:step (state/get-state :graph/importing-state))))

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
      (p/let [_ (repo-handler/restore-and-setup-repo! current-repo {:file-graph-import? true})]
        (finish-file-graph-import! current-repo {} nil))
      (do
        (clear-file-graph-importing-ui!)
        (when created-new-graph?
          (notification/show! (t :import/unexpected-error
                                 (or (.-message error) (str error)))
                              :error)
          (state/pub-event! [:graph/switch previous-repo {:persist? false}]))
        (when (and (not created-new-graph?)
                   (contains? #{:file-graph-import/graph-not-created :import-scan/failed}
                              (:code (ex-data error))))
          (notification/show! (t :import/unexpected-error
                                 (or (.-message error) (str error)))
                              :error))
        nil))))

(defn- import-file-graph
  ([*files user-options config-file client-ignored-files]
   (import-file-graph *files user-options config-file client-ignored-files nil))
  ([*files
    {:keys [graph-name] :as user-options}
    config-file
    client-ignored-files
    {:keys [<confirm-scan]}]
   (let [previous-repo (state/get-current-repo)
        expected-repo (str config/db-version-prefix graph-name)]
    (start-file-graph-import-session! *files)
    (-> (p/let [file-metas (mapv import-file-descriptor *files)
                serialized-config-file (first (filter #(= (:path %) (:path config-file)) file-metas))
                options (build-file-graph-worker-options user-options config/config-default-content)
                ;; Dry-run the export on a throwaway in-memory conn so the user
                ;; can see what will be created/skipped before importing
                _ (open-scan-dialog!)
                scan-result (-> (state/<invoke-db-worker :thread-api/scan-file-graph
                                                         serialized-config-file file-metas options)
                                (p/catch (fn [error]
                                           (throw (ex-info "Scanning the folder failed"
                                                           {:code :import-scan/failed}
                                                           error)))))
                _ (close-scan-dialog!)
                proceed? ((or <confirm-scan <confirm-import-scan!) scan-result)]
          (when proceed?
            (state/set-state! :graph/importing :file-graph)
            (state/set-state! :graph/importing-state file-graph-import-initial-ui-state)
            (open-import-indicator!)
            (p/let [start-time (t/now)
                    created-repo (repo-handler/new-db! graph-name {:file-graph-import? true})
                    repo (or created-repo (state/get-current-repo))]
              (when-not (= repo expected-repo)
                (throw (ex-info "File-graph import did not create a new graph"
                                {:code :file-graph-import/graph-not-created
                                 :expected expected-repo
                                 :repo repo})))
              (p/let [import-result (state/<invoke-db-worker :thread-api/import-file-graph repo serialized-config-file file-metas options)
                      ;; Import txs do not broadcast renderer deltas. Restore after
                      ;; import so this client sees pages and refs. Keep importing
                      ;; set so :graph/restored does not start a second search build.
                      _ (repo-handler/restore-and-setup-repo! repo {:file-graph-import? true})]
                (log/info :import-file-graph {:msg (str "Import finished in " (/ (t/in-millis (t/interval start-time (t/now))) 1000) " seconds")})
                (finish-file-graph-import! repo import-result client-ignored-files)))))
        (p/catch (fn [error]
                   (abort-file-graph-import! error previous-repo)))
        (p/finally (fn []
                     (file-graph-import/clear-file-graph-import-session!)))))))

(defn import-file-to-db-handler
  "Import from a graph folder as a DB-based graph"
  [ev opts]
  (let [^js file-objs (if ev (array-seq (.-files (.-target ev))) #js [])
        original-graph-name (if (first file-objs)
                              (string/replace (.-webkitRelativePath (first file-objs)) #"/.*" "")
                              "")
        import-graph-fn (or (:import-graph-fn opts)
                            (fn [user-inputs]
                              (let [all-files (mapv #(hash-map :file-object %
                                                               :path (path/trim-dir-prefix original-graph-name (.-webkitRelativePath %))
                                                               :fs-path (when (util/electron?)
                                                                          (js/window.apis.getFilePath %))
                                                               :last-modified-at (some-> (.-lastModified %) js/Date.))
                                                    file-objs)
                                    ;; TODO: Update this when supporting more formats as this aggressively excludes most formats
                                    client-ignored? (fn [file]
                                                      (and (not (string/starts-with? (:path file) "assets/"))
                                                           (ignored-path? original-graph-name (.-webkitRelativePath (:file-object file)))))
                                    files (vec (remove client-ignored? all-files))
                                    client-ignored-files (->> all-files
                                                              (filter client-ignored?)
                                                              (map #(select-keys % [:path])))]
                                ;; A folder without logseq/config.edn is imported
                                ;; as plain Markdown with the default config
                                (import-file-graph files user-inputs
                                                   (first (filter #(= (:path %) "logseq/config.edn") files))
                                                   client-ignored-files))))
        plain-markdown? (not (some (fn [file-obj]
                                     (= "logseq/config.edn"
                                        (path/trim-dir-prefix original-graph-name (.-webkitRelativePath file-obj))))
                                   file-objs))]
    (shui/dialog-open!
     #(import-file-graph-dialog original-graph-name
                                (fn [{:keys [graph-name] :as user-inputs}]
                                  (let [trimmed-graph-name (string/trim graph-name)]
                                    (cond
                                      (string/blank? trimmed-graph-name)
                                      (notification/show! (t :import/empty-graph-name) :error)

                                      (repo/invalid-graph-name? trimmed-graph-name)
                                      (repo/invalid-graph-name-warning)

                                      (repo-handler/graph-already-exists? trimmed-graph-name)
                                      (notification/show! (t :import/graph-name-conflict) :error)

                                      :else
                                      (import-graph-fn (assoc user-inputs :graph-name trimmed-graph-name)))))
                                {:plain-markdown? plain-markdown?}))))

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
