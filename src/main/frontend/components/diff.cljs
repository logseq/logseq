(ns frontend.components.diff
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.handler.git :as git-handler]
            [frontend.handler.file :as file]
            [frontend.handler.notification :as notification]
            [frontend.handler.common :as common-handler]
            [frontend.state :as state]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.svg :as svg]
            [frontend.ui :as ui]
            [frontend.db :as db]
            [frontend.git :as git]
            [goog.object :as gobj]
            [promesa.core :as p]
            [frontend.github :as github]
            [frontend.diff :as diff]
            [medley.core :as medley]))

(defonce diffs (atom nil))
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

(rum/defc file < rum/reactive
  [repo type path contents remote-oid component]
  (let [{:keys [collapse? resolved?]} (util/react (rum/cursor diff-state path))
        edit? (util/react *edit?)]
    [:div.cp__diff-file
     [:div.cp__diff-file-header
      [:a.mr-2 {:on-click (fn [] (toggle-collapse? path))}
       (if collapse?
         (svg/arrow-right)
         (svg/arrow-down))]
      [:span.cp__diff-file-header-content path]
      [:span.cp__diff-file-header-type type]
      (when resolved?
        [:span.text-green-600
         {:dangerouslySetInnerHTML
          {:__html "&#10003;"}}])]

     (if-let [content (get contents path)]
       (let [local-content (db/get-file path)
             local-content (or local-content "")
             diff (medley/indexed (diff/diff local-content content))
             diff? (some (fn [[_idx {:keys [added removed]}]]
                           (or added removed))
                         diff)]
         [:div.pre-line-white-space.p-2 {:class (if collapse? "hidden")
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
                          (file/alter-file repo path content
                                           {:commit? false
                                            :re-render-root? true})
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
            nil)])
       [:div "loading..."])]))

;; TODO: `n` shortcut for next diff, `p` for previous diff
(rum/defcc diff < rum/reactive
  {:will-mount
   (fn [state]
     (when-let [repo (state/get-current-repo)]
       (p/let [remote-latest-commit (common-handler/get-remote-ref repo)
               local-latest-commit (common-handler/get-ref repo)
               result (git/get-local-diffs repo local-latest-commit remote-latest-commit)]
         (reset! diffs result)
         (reset! remote-hash-id remote-latest-commit)
         (doseq [{:keys [type path]} result]
           (when (contains? #{"added" "modify"}
                            type)
             (github/get-content
              (state/get-github-token repo)
              repo
              path
              remote-latest-commit
              (fn [{:keys [repo-url path ref content]}]
                (swap! state/state
                       assoc-in [:github/contents repo-url remote-latest-commit path] content))
              (fn [response]
                (when (= (gobj/get response "status") 401)
                  (notification/show!
                   [:span.text-gray-700.mr-2
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
     (reset! diffs nil)
     (reset! remote-hash-id nil)
     (reset! diff-state {})
     (reset! commit-message "")
     (reset! *pushing? nil)
     (reset! *edit? false)
     (reset! *edit-content "")
     state)}
  [component]
  (let [diffs (util/react diffs)
        remote-oid (util/react remote-hash-id)
        repo (state/get-current-repo)
        contents (if remote-oid (state/sub [:github/contents repo remote-oid]))
        pushing? (util/react *pushing?)]
    [:div#diffs {:style {:margin-bottom 200}}
     [:h1.title "Diff"]
     (cond
       (false? pushing?)
       [:div "No diffs"]

       (seq diffs)
       [:div#diffs-body
        (for [{:keys [type path]} diffs]
          (rum/with-key (file repo type path contents remote-oid component)
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
