(ns frontend.handler.file-based.events
  "Events that are only for file graphs"
  (:require [clojure.core.async :as async]
            [clojure.set :as set]
            [clojure.string :as string]
            [frontend.components.diff :as diff]
            [frontend.components.encryption :as encryption]
            [frontend.components.file-based.git :as git-component]
            [frontend.components.file-sync :as file-sync]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.fs :as fs]
            [frontend.fs.sync :as sync]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.events :as events]
            [frontend.handler.file-based.file :as file-handler]
            [frontend.handler.file-based.native-fs :as nfs-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.graph-picker :as graph-picker]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.shortcut.core :as st]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(defmethod events/handle :graph/ask-for-re-index [[_ *multiple-windows? ui]]
  ;; *multiple-windows? - if the graph is opened in multiple windows, boolean atom
  ;; ui - custom message to show on asking for re-index
  (if (and (util/atom? *multiple-windows?) @*multiple-windows?)
    (shui/dialog-open!
     [:div
      (when (not (nil? ui)) ui)
      [:p (t :re-index-multiple-windows-warning)]])

    (shui/dialog-open!
     [:div {:style {:max-width 700}}
      (when (not (nil? ui)) ui)
      [:p (t :re-index-discard-unsaved-changes-warning)]
      [:div.flex.justify-end.pt-2
       (ui/button
        (t :yes)
        :autoFocus "on"
        :class "ui__modal-enter"
        :on-click (fn []
                    (shui/dialog-close!)
                    (state/pub-event! [:graph/re-index])))]])))

(defmethod events/handle :graph/re-index [[_]]
  ;; Ensure the graph only has ONE window instance
  (when (config/local-file-based-graph? (state/get-current-repo))
    (async/go
      (async/<! (sync/<sync-stop))
      (repo-handler/re-index!
       nfs-handler/rebuild-index!
       #(do (page-handler/create-today-journal!)
            (events/file-sync-restart!))))))

(defn set-block-query-properties!
  [block-id all-properties key add?]
  (when-let [block (db/entity [:block/uuid block-id])]
    (let [query-properties (get-in block [:block/properties :query-properties])
          repo (state/get-current-repo)
          query-properties (some-> query-properties
                                   (common-handler/safe-read-string "Parsing query properties failed"))
          query-properties (if (seq query-properties)
                             query-properties
                             all-properties)
          query-properties (if add?
                             (distinct (conj query-properties key))
                             (remove #{key} query-properties))
          query-properties (vec query-properties)]
      (if (seq query-properties)
        (property-handler/set-block-property! repo block-id
                                              :query-properties
                                              (str query-properties))
        (property-handler/remove-block-property! repo block-id :query-properties)))))

(defonce *query-properties (atom {}))
(rum/defc query-properties-settings-inner < rum/reactive
  {:will-unmount (fn [state]
                   (reset! *query-properties {})
                   state)}
  [block shown-properties all-properties]
  (let [query-properties (rum/react *query-properties)]
    [:div
     [:h1.font-semibold.-mt-2.mb-2.text-lg (t :query/config-property-settings)]
     [:a.flex
      {:title "Refresh list of columns"
       :on-click
       (fn []
         (reset! *query-properties {})
         (property-handler/remove-block-property! (state/get-current-repo) (:block/uuid block) :query-properties))}
      (ui/icon "refresh")]
     (for [property all-properties]
       (let [property-value (get query-properties property)
             shown? (if (nil? property-value)
                      (contains? shown-properties property)
                      property-value)]
         [:div.flex.flex-row.my-2.justify-between.align-items
          [:div (name property)]
          [:div.mt-1 (ui/toggle shown?
                                (fn []
                                  (let [value (not shown?)]
                                    (swap! *query-properties assoc property value)
                                    (set-block-query-properties!
                                     (:block/uuid block)
                                     all-properties
                                     property
                                     value)))
                                true)]]))]))

(defn query-properties-settings
  [block shown-properties all-properties]
  (fn [_close-fn]
    (query-properties-settings-inner block shown-properties all-properties)))

(defmethod events/handle :modal/set-query-properties [[_ block all-properties]]
  (let [query-properties (get-in block [:block/properties :query-properties])
        block-properties (some-> query-properties
                                 (common-handler/safe-read-string "Parsing query properties failed"))
        shown-properties (if (seq block-properties)
                           (set block-properties)
                           (set all-properties))
        shown-properties (set/intersection (set all-properties) shown-properties)]
    (shui/dialog-open!
     (query-properties-settings block shown-properties all-properties)
     {})))

(defmethod events/handle :modal/set-git-username-and-email [[_ _content]]
  (shui/dialog-open! git-component/set-git-username-and-email))

(defmethod events/handle :file/not-matched-from-disk [[_ path disk-content db-content]]
  (when-let [repo (state/get-current-repo)]
    (shui/dialog-open!
     #(diff/local-file repo path disk-content db-content)
     {:label "diff__cp"})))

(defmethod events/handle :modal/display-file-version-selector  [[_ versions path  get-content]]
  (shui/dialog-open!
   #(git-component/file-version-selector versions path get-content)))

(defmethod events/handle :modal/remote-encryption-input-pw-dialog [[_ repo-url remote-graph-info type opts]]
  (shui/dialog-open!
   (encryption/input-password
    repo-url nil (merge
                  (assoc remote-graph-info
                         :type (or type :create-pwd-remote)
                         :repo repo-url)
                  opts))
   {:center? true :close-btn? false :close-backdrop? false}))

(defmethod events/handle :graph/pull-down-remote-graph [[_ graph dir-name]]
  (if (mobile-util/native-ios?)
    (when-let [graph-name (or dir-name (:GraphName graph))]
      (let [graph-name (util/safe-sanitize-file-name graph-name)]
        (if (string/blank? graph-name)
          (notification/show! "Illegal graph folder name.")

          ;; Create graph directory under Logseq document folder (local)
          (when-let [root (state/get-local-container-root-url)]
            (let [graph-path (graph-picker/validate-graph-dirname root graph-name)]
              (->
               (p/let [exists? (fs/dir-exists? graph-path)]
                 (let [overwrite? (if exists?
                                    (js/confirm (str "There's already a directory with the name \"" graph-name "\", do you want to overwrite it? Make sure to backup it first if you're not sure about it."))
                                    true)]
                   (if overwrite?
                     (p/let [_ (fs/mkdir-if-not-exists graph-path)]
                       (nfs-handler/ls-dir-files-with-path!
                        graph-path
                        {:ok-handler (fn []
                                       (file-sync-handler/init-remote-graph graph-path graph)
                                       (js/setTimeout (fn [] (repo-handler/refresh-repos!)) 200))}))
                     (let [graph-name (-> (js/prompt "Please specify a new directory name to download the graph:")
                                          str
                                          string/trim)]
                       (when-not (string/blank? graph-name)
                         (state/pub-event! [:graph/pull-down-remote-graph graph graph-name]))))))
               (p/catch (fn [^js e]
                          (notification/show! (str e) :error)
                          (js/console.error e)))))))))
    (when (:GraphName graph)
      (shui/dialog-open!
       (file-sync/pick-dest-to-sync-panel graph)))))

(defmethod events/handle :graph/pick-page-histories [[_ graph-uuid page-name]]
  (shui/dialog-open!
   (file-sync/pick-page-histories-panel graph-uuid page-name)
   {:id :page-histories :label "modal-page-histories"}))

(defmethod events/handle :file-sync/maybe-onboarding-show [[_ type]]
  (when-not util/web-platform?
    (file-sync/maybe-onboarding-show type)))

(defmethod events/handle :file-sync/storage-exceed-limit [[_]]
  (notification/show! "file sync storage exceed limit" :warning false)
  (events/file-sync-stop!))

(defmethod events/handle :file-sync/graph-count-exceed-limit [[_]]
  (notification/show! "file sync graph count exceed limit" :warning false)
  (events/file-sync-stop!))

(defmethod events/handle :graph/dir-gone [[_ dir]]
  (state/pub-event! [:notification/show
                     {:content (str "The directory " dir " has been renamed or deleted, the editor will be disabled for this graph, you can unlink the graph.")
                      :status :error
                      :clear? false}])
  (state/update-state! :file/unlinked-dirs (fn [dirs] (conj dirs dir))))

(defmethod events/handle :graph/dir-back [[_ repo dir]]
  (when (contains? (:file/unlinked-dirs @state/state) dir)
    (notification/clear-all!)
    (state/pub-event! [:notification/show
                       {:content (str "The directory " dir " has been back, you can edit your graph now.")
                        :status :success
                        :clear? true}])
    (state/update-state! :file/unlinked-dirs (fn [dirs] (disj dirs dir)))
    (when (= dir (config/get-repo-dir repo))
      (fs/watch-dir! dir))))

(defmethod events/handle :ui/notify-skipped-downloading-files [[_ paths]]
  (notification/show!
   [:div
    [:div.mb-4
     [:div.font-semibold.mb-4.text-xl "It seems that some of your filenames are in the outdated format."]
     [:p
      "The files below that have reserved characters can't be saved on this device."]
     [:div.overflow-y-auto.max-h-96
      [:ol.my-2
       (for [path paths]
         [:li path])]]

     [:div
      [:p
       "Check " [:a {:href "https://docs.logseq.com/#/page/logseq%20file%20and%20folder%20naming%20rules"
                     :target "_blank"}
                 "Logseq file and folder naming rules"]
       " for more details."]]]]
   :warning
   false))

(defmethod events/handle :graph/setup-a-repo [[_ opts]]
  (let [opts' (merge {:picked-root-fn #(state/close-modal!)
                      :native-icloud? (not (string/blank? (state/get-icloud-container-root-url)))
                      :logged?        (user-handler/logged-in?)} opts)]
    (if (mobile-util/native-ios?)
      (shui/dialog-open!
       #(graph-picker/graph-picker-cp opts')
       {:label "graph-setup"})
      (page-handler/ls-dir-files! st/refresh! opts'))))

(defmethod events/handle :file/alter [[_ repo path content]]
  (p/let [_ (file-handler/alter-file repo path content {:from-disk? true})]
    (ui-handler/re-render-root!)))

(rum/defcs file-id-conflict-item <
  (rum/local false ::resolved?)
  [state repo file data]
  (let [resolved? (::resolved? state)
        id (last (:assertion data))]
    [:li {:key file}
     [:div
      [:a {:on-click #(js/window.apis.openPath file)} file]
      (if @resolved?
        [:div.flex.flex-row.items-center
         (ui/icon "circle-check" {:style {:font-size 20}})
         [:div.ml-1 "Resolved"]]
        [:div
         [:p
          (str "It seems that another whiteboard file already has the ID \"" id
               "\". You can fix it by changing the ID in this file with another UUID.")]
         [:p
          "Or, let me"
          (ui/button "Fix"
                     :on-click (fn []
                                 (let [dir (config/get-repo-dir repo)]
                                   (p/let [content (fs/read-file dir file)]
                                     (let [new-content (string/replace content (str id) (str (random-uuid)))]
                                       (p/let [_ (fs/write-plain-text-file! repo
                                                                            dir
                                                                            file
                                                                            new-content
                                                                            {})]
                                         (reset! resolved? true))))))
                     :class "inline mx-1")
          "it."]])]]))

(defmethod events/handle :file/parse-and-load-error [[_ repo parse-errors]]
  (state/pub-event! [:notification/show
                     {:content
                      [:div
                       [:h2.title "Oops. These files failed to import to your graph:"]
                       [:ol.my-2
                        (for [[file error] parse-errors]
                          (let [data (ex-data error)]
                            (cond
                              (and (common-config/whiteboard? file)
                                   (= :transact/upsert (:error data))
                                   (uuid? (last (:assertion data))))
                              (rum/with-key (file-id-conflict-item repo file data) file)

                              :else
                              (do
                                (state/pub-event! [:capture-error {:error error
                                                                   :payload {:type :file/parse-and-load-error}}])
                                [:li.my-1 {:key file}
                                 [:a {:on-click #(js/window.apis.openPath file)} file]
                                 [:p (.-message error)]]))))]
                       [:p "Don't forget to re-index your graph when all the conflicts are resolved."]]
                      :status :error}]))

(defmethod events/handle :file-sync-graph/restore-file [[_ graph page-entity content]]
  (when (db/get-db graph)
    (let [file (:block/file page-entity)]
      (when-let [path (:file/path file)]
        (when (and (not= content (:file/content file))
                   (:file/content file))
          (sync/add-new-version-file graph path (:file/content file)))
        (p/let [_ (file-handler/alter-file graph
                                           path
                                           content
                                           {:re-render-root? true
                                            :skip-compare? true})]
          (state/close-modal!)
          (route-handler/redirect! {:to :page
                                    :path-params {:name (:block/name page-entity)}}))))))

(defmethod events/handle :sync/create-remote-graph [[_ current-repo]]
  (let [graph-name (js/decodeURI (util/node-path.basename current-repo))]
    (async/go
      (async/<! (sync/<sync-stop))
      (state/set-state! [:ui/loading? :graph/create-remote?] true)
      (when-let [GraphUUID (get (async/<! (file-sync-handler/create-graph graph-name)) 2)]
        (async/<! (sync/<sync-start))
        (state/set-state! [:ui/loading? :graph/create-remote?] false)
        ;; update existing repo
        (state/set-repos! (map (fn [r]
                                 (if (= (:url r) current-repo)
                                   (assoc r
                                          :GraphUUID GraphUUID
                                          :GraphName graph-name
                                          :remote? true)
                                   r))
                               (state/get-repos)))))))

(defmethod events/handle :journal/insert-template [[_ page-name]]
  (let [page-name (util/page-name-sanity-lc page-name)]
    (when-let [page (db/get-page page-name)]
      (p/do!
       (db-async/<get-block (state/get-current-repo) (:db/id page))
       (when (db/page-empty? (state/get-current-repo) page-name)
         (when-let [template (state/get-default-journal-template)]
           (editor-handler/insert-template!
            nil
            template
            {:target page})))))))

(defmethod events/handle :graph/backup-file [[_ repo file-path db-content]]
  (p/let [disk-content (fs/read-file "" file-path)]
    (fs/backup-db-file! repo file-path db-content disk-content)))

(defmethod events/handle :graph/notify-existing-file [[_ data]]
  (let [{:keys [current-file-path file-path]} data
        error (t :file/validate-existing-file-error current-file-path file-path)]
    (state/pub-event! [:notification/show
                       {:content error
                        :status :error
                        :clear? false}])))
