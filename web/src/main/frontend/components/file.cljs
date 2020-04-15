(ns frontend.components.file
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.handler :as handler]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.components.sidebar :as sidebar]
            [frontend.ui :as ui]
            [frontend.format.org-mode :as org]
            [frontend.components.content :as content]
            [goog.crypt.base64 :as b64]))

(defn- get-path
  [state]
  (let [route-match (first (:rum/args state))
        encoded-path (get-in route-match [:parameters :path :path])
        decoded-path (b64/decodeString encoded-path)]
    [encoded-path decoded-path]))

(rum/defcs file
  [state]
  (let [[encoded-path path] (get-path state)
        format (keyword (string/lower-case (last (string/split path #"\."))))]
    (sidebar/sidebar
     (cond
       (and format (contains? handler/text-formats format))
       [:div.content
        [:a {:href (str "/file/" encoded-path "/edit")}
         "edit"]
        (let [content (db/get-file (last (get-path state)))]
          (cond
            (string/blank? content)
            [:span]

            content
            (content/html content format org/default-config)

            :else
            "Loading ..."))]

       ;; image type
       (and format (contains? #{:png :jpg :jpeg} format))
       (content/html [:img {:src path}] format org/default-config)

       :else
       [:div "Format ." (name format) " is not supported."]))))

(defn- count-newlines
  [s]
  (count (re-seq #"\n" (or s ""))))

(rum/defcs edit <
  (rum/local nil ::content)
  (rum/local "" ::commit-message)
  {:will-mount (fn [state]
                 (assoc state ::initial-content (db/get-file (last (get-path state)))))}
  [state]
  (let [initial-content (get state ::initial-content)
        initial-rows (+ 3 (count-newlines initial-content))
        content (get state ::content)
        commit-message (get state ::commit-message)
        rows (if (nil? @content) initial-rows (+ 3 (count-newlines @content)))
        [_encoded-path path] (get-path state)]
    (sidebar/sidebar
     [:div.content
      [:h3.mb-2 (str "Update " path)]
      (ui/textarea
       {:initial-value initial-content
        :value-atom content
        :on-change #(reset! content (.. % -target -value))
        :auto-focus true})
      [:div.mt-1.mb-1.relative.rounded-md.shadow-sm
       [:input.form-input.block.w-full.sm:text-sm.sm:leading-5
        {:placeholder "Commit message"
         :on-change (fn [e]
                      (reset! commit-message (util/evalue e)))}]]
      (ui/button "Save" (fn []
                          (when (and (not (string/blank? @content))
                                     (not (= initial-content
                                             @content)))
                            (let [commit-message (if (string/blank? @commit-message)
                                                   (str "Update " path)
                                                   @commit-message)]
                              (handler/alter-file path commit-message @content)))))])))
