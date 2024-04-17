(ns logseq.shui.demo2
  (:require [clojure.string :as string]
            [rum.core :as rum]
            [logseq.shui.ui :as ui]
            [logseq.shui.popup.core :refer [install-popups update-popup! get-popup]]
            [logseq.shui.select.multi :refer [x-select-content]]
            [frontend.components.icon :refer [emojis-cp emojis icon-search]]
            [frontend.storage :as storage]
            [cljs-bean.core :as bean]
            [promesa.core :as p]))

(defn do-fetch!
  ([action] (do-fetch! action nil))
  ([action query-str]
   (-> (js/window.fetch
         (str "https://movies-api14.p.rapidapi.com/" (name action) (when query-str (str "?" query-str)))
         #js {:method "GET"
              :headers #js {:X-RapidAPI-Key "808ffd08c0mshc67d496f6024b46p164350jsn7b35179966c9",
                            :X-RapidAPI-Host "movies-api14.p.rapidapi.com"}})
     (p/then #(.json %)))))

(rum/defc multi-select-demo
  []

  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4.mb-8
    "Multi X Select"]

   (let [[items set-items!] (rum/use-state [])
         [q set-q!] (rum/use-state "")
         [fetching? set-fetching?] (rum/use-state nil)

         [selected-items set-selected-items!]
         (rum/use-state (storage/get :ls-demo-multi-selected-items))

         rm-item! (fn [item-or-id]
                    (set-selected-items!
                      (remove #(or (= item-or-id %)
                                 (= item-or-id (str (:id %))))
                        selected-items)))
         add-item! (fn [item] (set-selected-items! (conj selected-items item)))

         [open? set-open!] (rum/use-state false)]

     (rum/use-effect!
       (fn []
         (storage/set :ls-demo-multi-selected-items selected-items))
       [selected-items])

     (ui/card
       (ui/card-header
         (ui/card-title "Search Movies")
         (ui/card-description "x multiselect for the remote items"))
       (ui/card-content

         ;; Basic
         (ui/dropdown-menu
           {:open open?}
           ;; trigger
           (ui/dropdown-menu-trigger
             [:div.border.p-2.rounded.w-full.cursor-pointer.flex.items-center.gap-1.flex-wrap
              {:on-click (fn [^js e]
                           (let [^js target (.-target e)]
                             (if-let [^js c (some-> target (.closest ".close"))]
                               (some-> (.-dataset c) (.-k) (rm-item!))
                               (set-open! true))))}
              (for [{:keys [id original_title class poster_path]} selected-items]
                (ui/badge {:variant :secondary :class (str class " group relative")}
                  [:span.flex.items-center.gap-1.flex-nowrap
                   [:img {:src poster_path :class "w-[16px] scale-75"}]
                   [:b original_title]]
                  (ui/button
                    {:variant :destructive
                     :size :icon
                     :data-k id
                     :class "!rounded-full !h-4 !w-4 absolute top-[-7px] right-[-3px] group-hover:visible invisible close"}
                    (ui/tabler-icon "x" {:size 12}))))
              (ui/button {:variant :link :size :sm} "+")])
           ;; content
           (x-select-content items selected-items
             {;; test item render
              :open? open?
              :close! #(set-open! false)
              :search-enabled? true
              :search-key q
              :search-fn (fn [items]
                           (when (not fetching?) items))
              :on-search-key-change (fn [v]
                                      (set-q! v)
                                      (if (string/blank? v)
                                        (set-items! [])
                                        (when (not fetching?)
                                          (set-fetching? true)
                                          (-> (do-fetch! :search (str "query=" v))
                                            (p/then #(when-let [ret (bean/->clj %)]
                                                       (when-let [items (:contents ret)]
                                                         (set-items! (map (fn [item] (assoc item :id (:_id item))) (take 12 items))))))
                                            (p/finally #(set-fetching? false))))))

              :item-render (fn [item {:keys [selected?]}]
                             (if item
                               (ui/dropdown-menu-checkbox-item
                                 {:checked selected?
                                  :on-click (fn []
                                              (if selected?
                                                (rm-item! item)
                                                (add-item! item))
                                              ;(set-open! false)
                                              )}
                                 [:div.flex.items-center.gap-2
                                  [:span [:img {:src (:poster_path item)
                                                :class "w-[20px]"}]]
                                  [:span.flex.flex-col
                                   [:b (:original_title item)]
                                   [:small.opacity-50
                                    {:class "text-[10px]"}
                                    (:release_date item)]]])
                               (ui/dropdown-menu-separator)))

              :head-render (fn [] (when (and fetching? (not (string/blank? q)))
                                    [:b.flex.items-center.justify-center.py-4
                                     (ui/tabler-icon "loader" {:class "animate-spin"})]))
              ;:foot-render (fn [] [:b "footer"])

              :content-props
              {:align "start"
               :class "w-80"}})))))

   [:hr]

   (let [items [{:key 1 :value "Apple" :class "bg-gray-800 text-gray-50"}
                {:key 2 :value "Orange" :class "bg-orange-700 text-gray-50"}
                {:key 3 :value "Pear"}
                {:key 4 :value "Banana" :class "bg-yellow-700 text-gray-700"}]

         [selected-items set-selected-items!]
         (rum/use-state [(second items)])

         [search? set-search?] (rum/use-state false)

         rm-item! (fn [item] (set-selected-items! (remove #(= item %) selected-items)))
         add-item! (fn [item] (set-selected-items! (conj selected-items item)))
         on-chosen (fn [item {:keys [selected?]}]
                     (if (true? selected?)
                       (rm-item! item) (add-item! item)))
         [open? set-open!] (rum/use-state false)]

     (ui/card
       (ui/card-header
         (ui/card-title "Basic")
         (ui/card-description "x multiselect for shui"))
       (ui/card-content
         [:label.block.flex.items-center.pb-3.cursor-pointer
          (ui/checkbox {:checked search?
                        :on-click #(set-search? (not search?))})
          [:small.pl-2 "Enable basic search input"]]
         ;; Basic
         (ui/dropdown-menu
           {:open open?}
           ;; trigger
           (ui/dropdown-menu-trigger
             [:p.border.p-2.rounded.w-full.cursor-pointer
              {:on-click #(set-open! true)}
              (for [{:keys [key value class]} selected-items]
                (ui/badge {:variant :secondary :class class} (str "#" key " " value)))
              (ui/button {:variant :link :size :sm} "+")])
           ;; content
           (x-select-content items selected-items
             {:close! #(set-open! false)
              :search-enabled? search?
              :search-key-render (fn [q {:keys [items]}]
                                   (when (and (not (string/blank? q))
                                           (not (seq items)))
                                     [:b.flex.items-center.justify-center.py-4.gap-2.font-normal.opacity-80
                                      (ui/tabler-icon "lemon") [:small "No fruits!"]]))
              :on-chosen on-chosen
              :value-render (fn [v {:keys [selected?]}]
                              (if selected?
                                [:b.text-red-800 v]
                                [:b.text-green-800 v]))
              :content-props
              {:class "w-48"}})))))

   [:hr]

   (let [[items set-items!]
         (rum/use-state
           [{:key 1 :value "Apple" :class "bg-gray-800 text-gray-50"}
            {:key 2 :value "Orange" :class "bg-orange-700 text-gray-50"}
            nil
            {:key 3 :value "Pear"}
            {:key 4 :value "Banana" :class "bg-yellow-700 text-gray-700"}])

         [selected-items set-selected-items!]
         (rum/use-state [(last items) (first items)])

         rm-item! (fn [item] (set-selected-items! (remove #(= item %) selected-items)))
         add-item! (fn [item] (set-selected-items! (conj selected-items item)))
         on-chosen (fn [item {:keys [selected?]}]
                     (if (true? selected?)
                       (rm-item! item) (add-item! item)))
         [open? set-open!] (rum/use-state false)]

     (ui/card
       (ui/card-header
         (ui/card-title "Search & Custom")
         (ui/card-description "x multiselect for shui"))
       (ui/card-content

         ;; Basic
         (ui/dropdown-menu
           {:open open?}
           ;; trigger
           (ui/dropdown-menu-trigger
             [:p.border.p-2.rounded.w-full.cursor-pointer
              {:on-click #(set-open! true)}
              (for [{:keys [key value class]} selected-items]
                (ui/badge {:variant :secondary :class class} (str "#" key " " value)))
              (ui/button {:variant :link :size :sm} "+")])
           ;; content
           (x-select-content items selected-items
             {;; test item render
              :open? open?
              :close! #(set-open! false)
              :search-enabled? true
              :item-render (fn [item {:keys [selected?]}]
                             (if item
                               (ui/dropdown-menu-checkbox-item
                                 {:checked selected?
                                  :on-click (fn []
                                              (if selected?
                                                (rm-item! item)
                                                (add-item! item)))}
                                 (:value item))
                               (ui/dropdown-menu-separator)))

              :search-key-render
              (fn [k {:keys [items x-item exist-fn]}]
                (when (and
                        (not (string/blank? k))
                        (not (exist-fn)))
                  (x-item
                    {:on-click (fn []
                                 (ui/toast! (str "Create: " k) :warning)
                                 (set-open! false))}
                    (str "+ create: " k))))

              ;:head-render (fn [] [:b "header"])
              ;:foot-render (fn [] [:b "footer"])
              :content-props
              {:align "start"
               :class "w-48"}})))))
   ])

(rum/defc icon-picker-demo
  []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4.mb-8
    "UI X Emojis & Icons Picker"]

   [:div.border.rounded.bg-gray-01.overflow-hidden
    {:class "w-fit"}
    (icon-search)]])

(rum/defc popup-demo
  []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4 "UI X Popup"]

   ;(rum/portal
   ;  (install-popups)
   ;  js/document.body)

   (let [[emoji set-emoji!] (rum/use-state nil)
         [q set-q!] (rum/use-state "")
         *q-ref (rum/use-ref nil)

         emoji-picker
         (fn [_nested?]
           [:p.py-4
            "Choose a inline "
            [:a.underline
             {:on-click
              #(ui/popup-show! %
                 (fn [_config]
                   [:div.max-h-72.overflow-auto.p-1
                    (emojis-cp (take 80 emojis)
                      {:on-chosen
                       (fn [_ t]
                         (set-emoji! t)
                         (ui/popup-hide-all!))})])
                 {:content-props {:class "w-72 p-0"}
                  :as-dropdown? true})}
             (if emoji [:strong.px-1.text-6xl [:em-emoji emoji]] "emoji :O")] "."])]
     [:<>
      (emoji-picker nil)

      [:p.py-4
       (ui/button
         {:variant :secondary
          :on-click #(ui/popup-show! %
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
            :ref *q-ref
            :value q
            :on-change (fn [^js e]
                         (let [val (.-value (.-target e))]
                           (set-q! val)
                           (update-popup! :select-a-fruit-input [:content] (gen-content val))))
            :class "w-1/5"
            :on-focus (fn [^js e]
                        (let [id :select-a-fruit-input
                              [_ popup] (get-popup id)]
                          (if (not popup)
                            (ui/popup-show! (.-target e)
                              (gen-content q)
                              {:id id
                               :align "start"
                               :content-props
                               {:class "x-input-popup-content"
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
                                        (ui/popup-hide! id)))))
                                :onOpenAutoFocus #(.preventDefault %)}})

                            ;; update content
                            (update-popup! id [:content]
                              (gen-content q)))))
            ;:on-blur     (fn [^js e]
            ;               (let [^js target (.-relatedTarget e)]
            ;                 (js/console.log "==>>>" target)
            ;                 (when-not (.closest target ".x-input-popup-content")
            ;                   (hide-x-popup! :select-a-fruit-input))))
            }))]

      [:div.w-full.p-4.border.rounded.dotted.h-48.mt-8.bg-gray-02
       {:on-click #(ui/popup-show! %
                     (->> (range 8)
                       (map (fn [it]
                              (ui/dropdown-menu-item
                                {:on-select (fn []
                                              (ui/toast! it)
                                              (ui/popup-hide-all!))}
                                [:strong it]))))
                     {:as-dropdown? true
                      :content-props {:class "w-48"}})
        :on-context-menu #(ui/popup-show! %
                            [:h1.text-3xl.font-bold "hi x popup for custom context menu!"])}]])])

(rum/defc custom-trigger-content
  []
  [:p
   [:code "more content"] [:br]
   (ui/input {:auto-focus true}) [:br]
   (ui/button "select sth")])

(rum/defc sample-dropdown-trigger
  []

  [:div.py-4
   [:h1.text-3xl.font-bold.border-b.pb-4 "Sample dropdown/menu trigger"]
   [:div.py-4
    (ui/dropdown-menu
      (ui/dropdown-menu-trigger
        {:as-child true}
        (ui/trigger-child-wrap
          {:class "border p-6 border"}
          (custom-trigger-content)))
      (ui/dropdown-menu-content
        (ui/dropdown-menu-item "A item")
        (ui/dropdown-menu-item "B item")
        (ui/dropdown-menu-item "C item")))]
   ])

(rum/defc page
  []
  (sample-dropdown-trigger))