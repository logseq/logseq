(ns frontend.components.home
  (:require [rum.core :as rum]
            [frontend.mui :as mui]
            ["@material-ui/core/colors" :as colors]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [frontend.components.agenda :as agenda]
            [frontend.components.file :as file]
            [frontend.components.settings :as settings]
            [frontend.components.repo :as repo]
            [frontend.format :as format]
            [clojure.string :as string]))

(rum/defc content-html
  < {:did-mount (fn [state]
                  (doseq [block (-> (js/document.querySelectorAll "pre code")
                                    (array-seq))]
                    (js/hljs.highlightBlock block))
                  state)}
  [current-file html-content]
  [:div
   (mui/link {:style {:float "right"}
              :on-click (fn []
                          (handler/change-page :edit-file))}
     "edit")
   (util/raw-html html-content)])

(rum/defc home < rum/reactive
  []
  (let [state (rum/react state/state)
        {:keys [user tokens repos repo-url cloned? github-token github-repo contents loadings current-repo current-file files width drawer? tasks cloning?]} state
        loading? (get loadings current-file)
        width (or width (util/get-width))
        mobile? (and width (<= width 600))]
    (mui/container
     {:id "root-container"
      :style {:display "flex"
              :justify-content "center"
              ;; TODO: fewer spacing for mobile, 24px
              :margin-top 64}}
     (cond
       (nil? user)
       (mui/button {:variant "contained"
                    :color "primary"
                    :start-icon (mui/github-icon)
                    :href "/login/github"}
         "Login with Github")

       (empty? repos)
       (repo/add-repo repo-url)

       cloned?
       (mui/grid
        {:container true
         :spacing 3}
        (when-not mobile?
          (mui/grid {:xs 2}
                    (file/files-list current-repo files)))

        (if (and (not mobile?)
                 (not drawer?))
          (mui/divider {:orientation "vertical"
                        :style {:margin "0 24px"}}))
        (mui/grid {:xs 9
                   :style {:margin-left (if (or mobile? drawer?) 24 0)}}
                  (cond
                    (nil? current-file)
                    (agenda/agenda tasks)

                    loading?
                    [:div "Loading ..."]

                    :else
                    (let [content (get contents current-file)
                          suffix (last (string/split current-file #"\."))]
                      (if (and suffix (contains? #{"md" "markdown" "org"} suffix))
                        (content-html current-file (format/to-html content suffix))
                        [:div "File " suffix " is not supported."])))))
       cloning?
       [:div "Cloning..."]

       :else
       [:div "TBC"]
       ;; (settings/settings-form github-token github-repo)
       ))))
