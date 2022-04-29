(ns frontend.mobile.footer
  (:require [clojure.string :as string]
            [frontend.date :as date]
            [frontend.handler.editor :as editor-handler]
            [frontend.mobile.record :as record]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(rum/defc mobile-bar-command [command-handler icon]
  [:div
   [:button.bottom-action
    {:on-mouse-down (fn [e]
                      (util/stop e)
                      (command-handler))}
    (ui/icon icon {:style {:fontSize ui/icon-size}})]])

(defn seconds->minutes:seconds
  [seconds]
  (let [minutes (quot seconds 60)
        seconds (mod seconds 60)]
    (util/format "%02d:%02d" minutes seconds)))

(def *record-start (atom -1))
(rum/defcs audio-record-cp < rum/reactive
  {:did-mount (fn [state]
                (let [comp (:rum/react-component state)
                      callback #(rum/request-render comp)
                      interval (js/setInterval callback 1000)]
                  (assoc state ::interval interval)))
   :will-mount (fn [state]
                 (js/clearInterval (::interval state))
                 (dissoc state ::interval))}
  [state]
  (when (= (state/sub :editor/record-status) "RECORDING")
    (swap! *record-start inc))
  [:div.flex.flex-row
   (if (= (state/sub :editor/record-status) "NONE")
     (do
       (reset! *record-start -1)
       (mobile-bar-command #(record/start-recording) "microphone"))
     [:div.flex.flex-row
      (mobile-bar-command #(record/stop-recording) "player-stop")
      [:div.timer.pl-2 (seconds->minutes:seconds @*record-start)]])])

(rum/defc footer < rum/reactive
  []
  (when (state/sub :mobile/show-tabbar?)
    [:div.cp__footer.w-full.bottom-0.justify-between
     (audio-record-cp)
     (mobile-bar-command #(state/toggle-document-mode!) "notes")
     (mobile-bar-command
      #(let [page (or (state/get-current-page)
                      (string/lower-case (date/journal-name)))
             block (editor-handler/api-insert-new-block!
                    ""
                    {:page page
                     :replace-empty-target? true})]
         (js/setTimeout
          (fn [] (editor-handler/edit-block!
                  block
                  :max
                  (:block/uuid block))) 100))
      "edit")]))
