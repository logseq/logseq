(ns frontend.components.diff
  (:require [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.diff :as diff]
            [frontend.encrypt :as encrypt]
            [frontend.git :as git]
            [frontend.github :as github]
            [frontend.handler.common :as common-handler]
            [frontend.handler.file :as file]
            [frontend.handler.git :as git-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.object :as gobj]
            [medley.core :as medley]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce remote-hash-id (atom nil))
(defonce diff-state (atom {}))
(defonce commit-message (atom ""))
;; TODO: use db :git/status
(defonce *pushing? (atom nil))
(defonce *edit? (atom false))
(defonce *edit-content (atom ""))

(defn- toggle-collapse?
  [path]
  (swap! diff-state update-in [path :collapse?] not))

(defn- mark-as-resolved
  [path]
  (swap! diff-state assoc-in [path :resolved?] true)
  (swap! diff-state assoc-in [path :collapse?] true))

(rum/defc diff-cp
  [diff]
  [:div
   (for [[idx {:keys [added removed value]}] diff]
     (let [bg-color (cond
                      added "#057a55"
                      removed "#d61f69"
                      :else
                      "initial")]
       [:span.diff {:key idx
                    :style {:background-color bg-color}}
        value]))])

(rum/defcs file < rum/reactive
  {:will-mount (fn [state]
                 (let [*local-content (atom "")
                       [repo _ path & _others] (:rum/args state)]
                   (p/let [content (file/load-file repo path )]
                     (reset! *local-content content))
                   (assoc state ::local-content *local-content)))}
  [state repo type path contents remote-oid]
  (let [local-content (rum/react (get state ::local-content))
        {:keys [collapse? resolved?]} (util/react (rum/cursor diff-state path))
        edit? (util/react *edit?)
        delete? (= type "remove")]
    [:div.cp__diff-file
     [:div.cp__diff-file-header
      [:a.mr-2 {:on-click (fn [] (toggle-collapse? path))}
       (if collapse?
         (svg/arrow-right-2)
         (svg/arrow-down))]
      [:span.cp__diff-file-header-content {:style {:word-break "break-word"}}
       path]
      (when resolved?
        [:span.text-green-600
         {:dangerouslySetInnerHTML
          {:__html "&#10003;"}}])]

     (let [content (get contents path)]
       (if (or (and delete? (nil? content))
               content)
         (when (not= content local-content)
           (let [local-content (or local-content "")
                 content (or content "")
                 diff (medley/indexed (diff/diff local-content content))
                 diff? (some (fn [[_idx {:keys [added removed]}]]
                               (or added removed))
                             diff)]
             [:div.pre-line-white-space.p-2 {:class (when collapse? "hidden")
                                             :style {:overflow "auto"}}
              (if edit?
                [:div.grid.grid-cols-2.gap-1
                 (diff-cp diff)
                 (ui/textarea
                  {:default-value local-content
                   :on-change (fn [e]
                                (reset! *edit-content (util/evalue e)))})]
                (diff-cp diff))

              (cond
                edit?
                [:div.mt-2
                 (ui/button "Save"
                   :on-click
                   (fn []
                     (reset! *edit? false)
                     (let [new-content @*edit-content]
                       (file/alter-file repo path new-content
                                        {:commit? false
                                         :re-render-root? true})
                       (swap! state/state
                              assoc-in [:github/contents repo remote-oid path] new-content)
                       (mark-as-resolved path))))]

                diff?
                [:div.mt-2
                 (ui/button "Use remote"
                   :on-click
                   (fn []
                     ;; overwrite the file
                     (if delete?
                       (file/remove-file! repo path)
                       (file/alter-file repo path content
                                        {:commit? false
                                         :re-render-root? true}))
                     (mark-as-resolved path))
                   :background "green")

                 [:span.pl-2.pr-2 "or"]

                 (ui/button "Keep local"
                   :on-click
                   (fn []
                     ;; overwrite the file
                     (swap! state/state
                            assoc-in [:github/contents repo remote-oid path] local-content)
                     (mark-as-resolved path))
                   :background "pink")

                 [:span.pl-2.pr-2 "or"]

                 (ui/button "Edit"
                   :on-click
                   (fn []
                     (reset! *edit? true)))]

                :else
                nil)]))
         [:div "loading..."]))]))

;; TODO: `n` shortcut for next diff, `p` for previous diff


(rum/defc diff <
  rum/reactive
  {:will-mount
   (fn [state]
     (when-let [repo (state/get-current-repo)]
       (p/let [remote-latest-commit (common-handler/get-remote-ref repo)
               local-latest-commit (common-handler/get-ref repo)
               result (git/get-diffs repo local-latest-commit remote-latest-commit)
               token (common-handler/get-github-token repo)]
         (reset! state/diffs result)
         (reset! remote-hash-id remote-latest-commit)
         (doseq [{:keys [type path]} result]
           (when (contains? #{"add" "modify"}
                            type)
             (github/get-content
              token
              repo
              path
              remote-latest-commit
              (fn [{:keys [repo-url path ref content]}]
                (p/let [content (encrypt/decrypt content)]
                  (swap! state/state
                         assoc-in [:github/contents repo-url remote-latest-commit path] content)))
              (fn [response]
                (when (= (gobj/get response "status") 401)
                  (notification/show!
                   [:span.mr-2
                    (util/format
                     "Please make sure that you've installed the logseq app for the repo %s on GitHub. "
                     repo)
                    (ui/button
                      "Install Logseq on GitHub"
                      :href (str "https://github.com/apps/" config/github-app-name "/installations/new"))]
                   :error
                   false))))))))
     state)
   :will-unmount
   (fn [state]
     (reset! state/diffs nil)
     (reset! remote-hash-id nil)
     (reset! diff-state {})
     (reset! commit-message "")
     (reset! *pushing? nil)
     (reset! *edit? false)
     (reset! *edit-content "")
     state)}
  []
  (let [diffs (util/react state/diffs)
        remote-oid (util/react remote-hash-id)
        repo (state/get-current-repo)
        contents (when remote-oid (state/sub [:github/contents repo remote-oid]))
        pushing? (util/react *pushing?)]
    [:div#diffs {:style {:margin-bottom 200}}
     [:h1.title "Diff"]
     (cond
       (false? pushing?)
       [:div "No diffs"]

       (seq diffs)
       [:div#diffs-body
        (for [{:keys [type path]} diffs]
          (rum/with-key (file repo type path contents remote-oid)
            path))
        [:div
         (ui/textarea
          {:placeholder "Commit message (optional)"
           :on-change (fn [e]
                        (reset! commit-message (util/evalue e)))})
         (if pushing?
           [:span (ui/loading "Pushing")]
           (ui/button "Commit and push"
             :on-click
             (fn []
               (let [commit-message (if (string/blank? @commit-message)
                                      "Merge"
                                      @commit-message)]
                 (reset! *pushing? true)
                 (git-handler/commit-and-force-push! commit-message *pushing?)))))]]

       :else
       [:div "No diffs"])]))

(defonce disk-value (atom nil))
(defonce db-value (atom nil))
(rum/defcs local-file < rum/reactive
  {:will-unmount (fn [state]
                   (reset! disk-value nil)
                   (reset! db-value nil)
                   state)}
  [state repo path disk-content db-content]
  (when (nil? @disk-value)
    (reset! disk-value disk-content)
    (reset! db-value db-content))
  [:div.cp__diff-file {:style {:width 980}}
   [:div.cp__diff-file-header
    [:span.cp__diff-file-header-content.pl-1.font-medium {:style {:word-break "break-word"}}
     (str "File " path " has been modified on the disk.")]]
   [:div.p-4
    (when (not= (string/trim disk-content) (string/trim db-content))
      (ui/foldable
       [:span.text-sm.font-medium.ml-1 "Check diff"]
       (fn []
         (let [local-content (or db-content "")
               content (or disk-content "")
               diff (medley/indexed (diff/diff local-content content))
               diff? (some (fn [[_idx {:keys [added removed]}]]
                             (or added removed))
                           diff)]
           (when diff?
             [:div.overflow-y-scroll.flex.flex-col
              [:div {:style {:max-height "65vh"}}
               (diff-cp diff)]])))
       {:default-collapsed? true
        :title-trigger? true}))

    [:hr]

    [:div.flex.flex-row.mt-4
     [:div.flex-1
      [:div.mb-2 "On disk:"]
      [:textarea.overflow-auto
       {:value (rum/react disk-value)
        :on-change (fn [e]
                     (reset! disk-value (util/evalue e)))
        :style {:min-height "50vh"}}
       disk-content]
      (ui/button "Select this"
        :on-click
        (fn []
          (when-let [value @disk-value]
            (file/alter-file repo path @disk-value
                            {:re-render-root? true
                             :skip-compare? true}))
          (state/close-modal!)))]

     [:div.ml-4.flex-1
      [:div.mb-2 "In Logseq:"]
      [:textarea.overflow-auto
       {:value (rum/react db-value)
        :on-change (fn [e]
                     (prn "new-value: " (util/evalue e))
                     (reset! db-value (util/evalue e)))
        :style {:min-height "50vh"}}
       db-content]
      (ui/button "Select this"
        :on-click
        (fn []
          (when-let [value @db-value]
            (file/alter-file repo path value
                            {:re-render-root? true
                             :skip-compare? true}))
          (state/close-modal!)))]]]])
