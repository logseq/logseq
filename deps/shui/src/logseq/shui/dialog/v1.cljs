(ns logseq.shui.dialog.v1
  (:require
    [rum.core :as rum]
    [clojure.string :as string]
    [logseq.shui.icon.v2 :as icon]
    [logseq.shui.button.v2 :as button]))

(defn open-dialog! [state position]
  (js/console.log "open-dialog!")
  (when-let [el (some-> state ::dialog-ref deref)]
    (if (= position :modal)
      (.showModal ^js el)
      (.show ^js el))
    (reset! (::open state) true)))

(defn close-dialog! [state]
  (js/console.log "close-dialog!")
  (when-let [el (some-> state ::dialog-ref deref)]
    (.close ^js el)
    (reset! (::open state) false)))

(defn toggle-dialog! [state position]
  (js/console.log "toggle-dialog!")
  (if @(::open state)
    (close-dialog! state)
    (open-dialog! state position)))

(rum/defc dialog < rum/reactive
  [state props context]
  [:dialog {:ref #(when (and % (::dialog-ref state) (not= % (::dialog-ref state)))
                    (js/console.log "set dialog ref" %)
                    (reset! (::dialog-ref state) %))
            :class "text-xs bg-gray-03 right-full top-full text-white absolute left-0 w-64 p-0 rounded-lg shadow-lg overflow-hidden -border border-gray-06 py-2"
            :style {:transform "translate3d(calc(-100% + 32px), 4px, 0) "}
            :open @(::open state)}
   (for [[index group] (map-indexed vector (:groups props))]
    [:div {:key index}
     group])])
     ; (for [[index list-item] (map-indexed vector group)]
     ;  [:div {:key index} 
     ;   list])])])
   ; [:div.bg-gray-05
   ;  [:h1 "This is a dialog"]]])
   ; [:div.absolute.top-full.right-0.bg-gray-05
   ;  [:h1 "This is a dialog"]]])
  

(rum/defcs root < rum/reactive 
  (rum/local true ::open)
  (rum/local nil ::dialog-ref)
  [state
   {:keys [open position trigger] :as props
    :or {position :top-right}} 
   {:keys [] :as context}]
  ; (rum/use-effect! 
  ;   (fn [] 
  ;     (when (and @(::dialog-ref state) 
  ;                (not= @(::open state) open))
  ;       (if open 
  ;         (open-dialog! state position)
  ;         (close-dialog! state))))
  ;   [@(::dialog-ref state) open])
  (if trigger 
    (trigger {:open-dialog! #(open-dialog! state position)
              :close-dialog! #(close-dialog! state)
              :toggle-dialog! #(toggle-dialog! state position)
              :dialog (partial dialog state props context)})
    (dialog state props context)))
