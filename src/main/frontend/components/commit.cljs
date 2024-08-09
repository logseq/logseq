(ns frontend.components.commit
  (:require [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.mixins :as mixins]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [promesa.core :as p]
            [rum.core :as rum]
            [logseq.shui.ui :as shui]
            [frontend.persist-db :as persist-db]))

(defn- commit-all!
  []
  (let [value (gobj/get (gdom/getElement "commit-message") "value")]
    (when (and value (>= (count value) 1))
      (when (util/electron?)
        (ipc/ipc "gitCommitAll" value))
      (shui/dialog-close!))))

(defn prettify-git-status
  [status]
  (let [lines (string/split-lines status)]
    (->> lines
         (remove empty?)
         (map (fn [line]
                (let [first-char (first (string/trim line))]
                  (cond
                    (= first-char "#") [:span line] ;; TODO: handle `--branch` info
                    (= first-char "M") [:span.text-green-400 line]
                    (= first-char "A") [:span.text-green-500 line]
                    (= first-char "D") [:span.text-red-500 line]
                    (= first-char "?") [:span.text-green-500 line]
                    :else line))))
         (interpose [:br]))))


(rum/defcs add-commit-message < rum/reactive
  (rum/local nil ::git-status)
  {:will-mount (fn [state]
                 (-> (ipc/ipc "gitStatus" (state/get-current-repo))
                     (p/then (fn [status]
                               (reset! (get state ::git-status) status))))
                 state)
   :did-update (fn [state]
                 (when-let [input (gdom/getElement "commit-message")]
                   (.focus input)
                   (cursor/move-cursor-to-end input))
                 state)}
  (mixins/event-mixin
   (fn [state]
     (mixins/on-enter state
                      :node (gdom/getElement "commit-message")
                      :on-enter (fn []
                                  (commit-all!)))))
  [state]
  (let [*git-status (get state ::git-status)]
    [:div.w-full.mx-auto
     (if (empty? @*git-status)
       [:<>
        [:div.sm:flex.sm:items-start
         [:div.mt-4.text-center.sm:mt-0.sm:text-left.mb-0
          [:h3.text-lg.leading-6.font-medium
           "No changes to commit!"]]]]

       [:<>
        [:div.sm:flex.sm:items-start
         [:div.mt-3.text-center.sm:mt-0.sm:text-left.mb-2
          (if (nil? @*git-status)
            [:div "Loading..."]
            [:div.flex.w-full.flex-col
             [:h2.text-xl "You have uncommitted changes: "]
             [:pre.max-h-96.overflow-y-auto.bg-gray-02
              {:class "md:max-w-[700px]"}
              (prettify-git-status @*git-status)]])
          [:h3#modal-headline.text-lg.leading-6.font-medium
           "Your commit message:"]]]
        [:input#commit-message.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
         {:auto-focus true
          :default-value ""}]
        [:div.mt-5.sm:mt-4.flex.justify-end.pt-4
         (shui/button
           {:on-click #(commit-all!)}
           "Commit")]])]))

(defn show-commit-modal! [e]
  (p/do!
   (persist-db/export-current-graph!)
   (shui/dialog-open! add-commit-message
     {:content-props {:onOpenAutoFocus #(.preventDefault %)}})
   (when e (util/stop e))))
