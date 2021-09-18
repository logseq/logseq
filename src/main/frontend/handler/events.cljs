(ns frontend.handler.events
  (:refer-clojure :exclude [run!])
  (:require [clojure.core.async :as async]
            [clojure.set :as set]
            [datascript.core :as d]
            [frontend.components.diff :as diff]
            [frontend.components.plugins :as plugin]
            [frontend.components.encryption :as encryption]
            [frontend.components.git :as git-component]
            [frontend.components.shell :as shell]
            [frontend.components.search :as search]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.extensions.srs :as srs]
            [frontend.fs.nfs :as nfs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            ["semver" :as semver]
            [clojure.string :as string]
            [frontend.modules.instrumentation.posthog :as posthog]))

;; TODO: should we move all events here?

(defn show-install-error!
  [repo-url title]
  (spec/validate :repos/url repo-url)
  (notification/show!
   [:p.content
    title
    " "
    [:span.mr-2
     (util/format
      "Please make sure that you've installed the logseq app for the repo %s on GitHub. "
      repo-url)
     (ui/button
       "Install Logseq on GitHub"
       :href (str "https://github.com/apps/" config/github-app-name "/installations/new"))]]
   :error
   false))

(defmulti handle first)

(defmethod handle :repo/install-error [[_ repo-url title]]
  (show-install-error! repo-url title))

(defmethod handle :modal/encryption-setup-dialog [[_ repo-url close-fn]]
  (state/set-modal!
   (encryption/encryption-setup-dialog repo-url close-fn)))

(defmethod handle :modal/encryption-input-secret-dialog [[_ repo-url db-encrypted-secret close-fn]]
  (state/set-modal!
   (encryption/encryption-input-secret-dialog
    repo-url
    db-encrypted-secret
    close-fn)))

(defmethod handle :graph/added [[_ repo]]
  ;; add ast/version to db
  (let [conn (conn/get-conn repo false)
        ast-version (d/datoms @conn :aevt :ast/version)]
    (db/set-key-value repo :ast/version db-schema/ast-version)))

(defmethod handle :graph/migrated [[_ repo]]
  (js/alert "Graph migrated."))

(defn get-local-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when (config/local-db? repo)
      repo)))

(defn ask-permission
  [repo]
  (when-not (util/electron?)
    (fn [close-fn]
      [:div
       [:p
        "Grant native filesystem permission for directory: "
        [:b (config/get-local-dir repo)]]
       (ui/button
         "Grant"
         :class "ui__modal-enter"
         :on-click (fn []
                     (nfs/check-directory-permission! repo)
                     (close-fn)))])))

(defmethod handle :modal/nfs-ask-permission []
  (when-let [repo (get-local-repo)]
    (state/set-modal! (ask-permission repo))))

(defonce *query-properties (atom {}))
(rum/defc query-properties-settings-inner < rum/reactive
  {:will-unmount (fn [state]
                   (reset! *query-properties {})
                   state)}
  [block shown-properties all-properties close-fn]
  (let [query-properties (rum/react *query-properties)]
    [:div.p-4
     [:div.font-bold "Properties settings for this query:"]
     (for [property all-properties]
       (let [property-value (get query-properties property)
             shown? (if (nil? property-value)
                      (contains? shown-properties property)
                      property-value)]
         [:div.flex.flex-row.m-2.justify-between.align-items
          [:div (name property)]
          [:div.mt-1 (ui/toggle shown?
                                (fn []
                                  (let [value (not shown?)]
                                    (swap! *query-properties assoc property value)
                                    (editor-handler/set-block-query-properties!
                                     (:block/uuid block)
                                     all-properties
                                     property
                                     value)))
                                true)]]))]))

(defn query-properties-settings
  [block shown-properties all-properties]
  (fn [close-fn]
    (query-properties-settings-inner block shown-properties all-properties close-fn)))

(defmethod handle :modal/set-query-properties [[_ block all-properties]]
  (let [block-properties (some-> (get-in block [:block/properties :query-properties])
                                 (common-handler/safe-read-string "Parsing query properties failed"))
        shown-properties (if (seq block-properties)
                           (set block-properties)
                           (set all-properties))
        shown-properties (set/intersection (set all-properties) shown-properties)]
    (state/set-modal! (query-properties-settings block shown-properties all-properties))))

(defmethod handle :modal/show-cards [_]
  (state/set-modal! srs/global-cards))

(defmethod handle :modal/show-themes-modal [_]
  (plugin/open-select-theme!))

(rum/defc modal-output
  [content]
  content)

(defmethod handle :modal/show [[_ content]]
  (state/set-modal! #(modal-output content)))

(defmethod handle :modal/set-git-username-and-email [[_ content]]
  (state/set-modal! git-component/set-git-username-and-email))

(defmethod handle :page/title-property-changed [[_ old-title new-title]]
  (page-handler/rename! old-title new-title))

(defmethod handle :page/create-today-journal [[_ repo]]
  (page-handler/create-today-journal!))

(defmethod handle :file/not-matched-from-disk [[_ path disk-content db-content]]
  (state/clear-edit!)
  (when-let [repo (state/get-current-repo)]
    (when (not= (string/trim disk-content) (string/trim db-content))
      (state/set-modal! #(diff/local-file repo path disk-content db-content)))))

(defmethod handle :modal/display-file-version [[_ path content hash]]
  (state/set-modal! #(git-component/file-specific-version path hash content)))

(defmethod handle :after-db-restore [[_ repos]]
  (mapv (fn [{url :url} repo]
          ;; compare :ast/version
          (let [db (conn/get-conn url)
                ast-version (:v (first (d/datoms db :aevt :ast/version)))]
            (when (and (not= config/local-repo url)
                       (or (nil? ast-version)
                           (. semver lt ast-version db-schema/ast-version)))
              (notification/show!
               [:p.content
                (util/format "DB-schema updated, Please re-index repo [%s]" url)]
               :warning
               false))))
        repos))

(defmethod handle :command/run [_]
  (when (util/electron?)
    (state/set-modal! shell/shell)))

(defmethod handle :go/search [_]
  (state/set-modal! search/search-modal
                    {:fullscreen? false
                     :close-btn?  false}))

(defmethod handle :instrument [[_ {:keys [type payload]}]]
  (posthog/capture type payload))

(defn run!
  []
  (let [chan (state/get-events-chan)]
    (async/go-loop []
      (let [payload (async/<! chan)]
        (handle payload))
      (recur))
    chan))
