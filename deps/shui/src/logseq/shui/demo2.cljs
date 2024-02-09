(ns logseq.shui.demo2
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]
            [logseq.shui.popup.core :refer [get-popup] :as popup-core]
            [frontend.components.icon :refer [emojis-cp emojis]]))

(rum/defc page []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4 "UI X Popup"]

   (rum/portal
     (popup-core/install-popups)
     js/document.body)

   (let [[emoji set-emoji!] (rum/use-state nil)
         [q set-q!] (rum/use-state "")
         *q-ref (rum/use-ref nil)

         emoji-picker
         (fn [_nested?]
           [:p.py-4
            "Choose a inline "
            [:a.underline
             {:on-click
              #(popup-core/show! %
                 (fn [_config]
                   [:div.max-h-72.overflow-auto.p-1
                    (emojis-cp (take 80 emojis)
                      {:on-chosen
                       (fn [_ t]
                         (set-emoji! t)
                         (popup-core/hide-all!))})])
                 {:content-props {:class "w-72 p-0"}
                  :as-menu?      true})}
             (if emoji [:strong.px-1.text-6xl [:em-emoji emoji]] "emoji :O")] "."])]
     [:<>
      (emoji-picker nil)

      [:p.py-4
       (ui/button
         {:variant  :secondary
          :on-click #(popup-core/show! %
                       (fn []
                         [:p.p-4
                          (emoji-picker true)]))}
         "Play a nested x popup.")]

      [:p.py-4
       (let [gen-content
             (fn [q]
               [:p.x-input-popup-content.bg-green-rx-06
                (ui/button {:on-click #(ui/toast! "Just a joke :)")} "play a magic")
                (emoji-picker true)
                [:strong.px-1.text-6xl q]])]
         (ui/input
           {:placeholder "Select a fruit."
            :ref         *q-ref
            :value       q
            :on-change   (fn [^js e]
                           (let [val (.-value (.-target e))]
                             (set-q! val)
                             (popup-core/update-popup! :select-a-fruit-input [:content] (gen-content val))))
            :class       "w-1/5"
            :on-focus    (fn [^js e]
                           (let [id :select-a-fruit-input
                                 [_ popup] (get-popup id)]
                             (if (not popup)
                               (popup-core/show! (.-target e)
                                 (gen-content q)
                                 {:id id
                                  :content-props
                                  {:class           "x-input-popup-content"
                                   :onPointerDownOutside
                                   (fn [^js e]
                                     (js/console.log "===>> onPointerDownOutside:" e (rum/deref *q-ref))
                                     (when-let [q-ref (rum/deref *q-ref)]
                                       (let [^js target (or (.-relatedTarget e)
                                                          (.-target e))]
                                         (js/console.log "t:" target)
                                         (when (and
                                                 (not (.contains q-ref target))
                                                 (not (.closest target ".x-input-popup-content")))
                                           (popup-core/hide! id)))))
                                   :onOpenAutoFocus #(.preventDefault %)}})

                               ;; update content
                               (popup-core/update-popup! id [:content]
                                 (gen-content q)))))
            ;:on-blur     (fn [^js e]
            ;               (let [^js target (.-relatedTarget e)]
            ;                 (js/console.log "==>>>" target)
            ;                 (when-not (.closest target ".x-input-popup-content")
            ;                   (hide-x-popup! :select-a-fruit-input))))
            }))]

      [:div.w-full.p-4.border.rounded.dotted.h-48.mt-8.bg-gray-02
       {:on-click        #(popup-core/show! %
                            (->> (range 8)
                              (map (fn [it]
                                     (ui/dropdown-menu-item
                                       {:on-select (fn []
                                                     (ui/toast! it)
                                                     (popup-core/hide-all!))}
                                       [:strong it]))))
                            {:as-menu?      true
                             :content-props {:class "w-48"}})
        :on-context-menu #(popup-core/show! %
                            [:h1.text-3xl.font-bold "hi x popup for custom context menu!"])}]])])