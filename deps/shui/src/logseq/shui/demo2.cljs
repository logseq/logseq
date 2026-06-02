(ns logseq.shui.demo2
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.components.icon :refer [emojis-cp emojis icon-search]]
            [frontend.storage :as storage]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.popup.core :refer [update-popup! get-popup]]
            [logseq.shui.select.multi :refer [x-select-content]]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defn do-fetch!
  ([action] (do-fetch! action nil))
  ([action query-str]
   (-> (js/window.fetch
        (str "https://movies-api14.p.rapidapi.com/" (name action) (when query-str (str "?" query-str)))
        #js {:method "GET"
             :headers #js {:X-RapidAPI-Key "808ffd08c0mshc67d496f6024b46p164350jsn7b35179966c9",
                           :X-RapidAPI-Host "movies-api14.p.rapidapi.com"}})
       (p/then #(.json %)))))

(hsx/defc multi-select-demo
  []

  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4.mb-8
    "Multi X Select"]

   (let [[items set-items!] (hooks/use-state [])
         [q set-q!] (hooks/use-state "")
         [fetching? set-fetching?] (hooks/use-state nil)

         [selected-items set-selected-items!]
         (hooks/use-state (storage/get :ls-demo-multi-selected-items))

         rm-item! (fn [item-or-id]
                    (set-selected-items!
                     (remove #(or (= item-or-id %)
                                  (= item-or-id (str (:id %))))
                             selected-items)))
         add-item! (fn [item] (set-selected-items! (conj selected-items item)))

         [open? set-open!] (hooks/use-state false)]

     (hooks/use-effect!
      (fn []
        (storage/set :ls-demo-multi-selected-items selected-items))
      [selected-items])

     (shui/card
      (shui/card-header
       (shui/card-title "Search Movies")
       (shui/card-description "x multiselect for the remote items"))
      (shui/card-content

         ;; Basic
       (shui/dropdown-menu
        {:open open?}
           ;; trigger
        (shui/dropdown-menu-trigger
         [:div.border.p-2.rounded.w-full.cursor-pointer.flex.items-center.gap-1.flex-wrap
          {:on-click (fn [^js e]
                       (let [^js target (.-target e)]
                         (if-let [^js c (some-> target (.closest ".close"))]
                           (some-> (.-dataset c) (.-k) (rm-item!))
                           (set-open! true))))}
          (for [{:keys [id original_title class poster_path]} selected-items]
            (shui/badge {:variant :secondary :class (str class " group relative")}
                      [:span.flex.items-center.gap-1.flex-nowrap
                       [:img {:src poster_path :class "w-[16px] scale-75"}]
                       [:b original_title]]
                      (shui/button
                       {:variant :destructive
                        :size :icon
                        :data-k id
                        :class "!rounded-full !h-4 !w-4 absolute top-[-7px] right-[-3px] group-hover:visible invisible close"}
                       (shui/tabler-icon "x" {:size 12}))))
          (shui/button {:variant :link :size :sm} "+")])
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
                                            (shui/dropdown-menu-checkbox-item
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
                                            (shui/dropdown-menu-separator)))

                           :head-render (fn [] (when (and fetching? (not (string/blank? q)))
                                                 [:b.flex.items-center.justify-center.py-4
                                                  (shui/tabler-icon "loader" {:class "animate-spin"})]))
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
         (hooks/use-state [(second items)])

         [search? set-search?] (hooks/use-state false)

         rm-item! (fn [item] (set-selected-items! (remove #(= item %) selected-items)))
         add-item! (fn [item] (set-selected-items! (conj selected-items item)))
         on-chosen (fn [item {:keys [selected?]}]
                     (if (true? selected?)
                       (rm-item! item) (add-item! item)))
         [open? set-open!] (hooks/use-state false)]

     (shui/card
      (shui/card-header
       (shui/card-title "Basic")
       (shui/card-description "x multiselect for shui"))
      (shui/card-content
       [:label.block.flex.items-center.pb-3.cursor-pointer
        (shui/checkbox {:checked search?
                      :on-click #(set-search? (not search?))})
        [:small.pl-2 "Enable basic search input"]]
         ;; Basic
       (shui/dropdown-menu
        {:open open?}
           ;; trigger
        (shui/dropdown-menu-trigger
         [:p.border.p-2.rounded.w-full.cursor-pointer
          {:on-click #(set-open! true)}
          (for [{:keys [key value class]} selected-items]
            (shui/badge {:variant :secondary :class class} (str "#" key " " value)))
          (shui/button {:variant :link :size :sm} "+")])
           ;; content
        (x-select-content items selected-items
                          {:close! #(set-open! false)
                           :search-enabled? search?
                           :search-key-render (fn [q {:keys [items]}]
                                                (when (and (not (string/blank? q))
                                                           (not (seq items)))
                                                  [:b.flex.items-center.justify-center.py-4.gap-2.font-normal.opacity-80
                                                   (shui/tabler-icon "lemon") [:small "No fruits!"]]))
                           :on-chosen on-chosen
                           :value-render (fn [v {:keys [selected?]}]
                                           (if selected?
                                             [:b.text-red-800 v]
                                             [:b.text-green-800 v]))
                           :content-props
                           {:class "w-48"}})))))

   [:hr]

   (let [[items _set-items!]
         (hooks/use-state
          [{:key 1 :value "Apple" :class "bg-gray-800 text-gray-50"}
           {:key 2 :value "Orange" :class "bg-orange-700 text-gray-50"}
           nil
           {:key 3 :value "Pear"}
           {:key 4 :value "Banana" :class "bg-yellow-700 text-gray-700"}])

         [selected-items set-selected-items!]
         (hooks/use-state [(last items) (first items)])

         rm-item! (fn [item] (set-selected-items! (remove #(= item %) selected-items)))
         add-item! (fn [item] (set-selected-items! (conj selected-items item)))
         _on-chosen (fn [item {:keys [selected?]}]
                     (if (true? selected?)
                       (rm-item! item) (add-item! item)))
         [open? set-open!] (hooks/use-state false)]

     (shui/card
      (shui/card-header
       (shui/card-title "Search & Custom")
       (shui/card-description "x multiselect for shui"))
      (shui/card-content

         ;; Basic
       (shui/dropdown-menu
        {:open open?}
           ;; trigger
        (shui/dropdown-menu-trigger
         [:p.border.p-2.rounded.w-full.cursor-pointer
          {:on-click #(set-open! true)}
          (for [{:keys [key value class]} selected-items]
            (shui/badge {:variant :secondary :class class} (str "#" key " " value)))
          (shui/button {:variant :link :size :sm} "+")])
           ;; content
        (x-select-content items selected-items
                          {;; test item render
                           :open? open?
                           :close! #(set-open! false)
                           :search-enabled? true
                           :item-render (fn [item {:keys [selected?]}]
                                          (if item
                                            (shui/dropdown-menu-checkbox-item
                                             {:checked selected?
                                              :on-click (fn []
                                                          (if selected?
                                                            (rm-item! item)
                                                            (add-item! item)))}
                                             (:value item))
                                            (shui/dropdown-menu-separator)))

                           :search-key-render
                           (fn [k {:keys [_items x-item exist-fn]}]
                             (when (and
                                    (not (string/blank? k))
                                    (not (exist-fn)))
                               (x-item
                                {:on-click (fn []
                                             (shui/toast! (str "Create: " k) :warning)
                                             (set-open! false))}
                                (str "+ create: " k))))

              ;:head-render (fn [] [:b "header"])
              ;:foot-render (fn [] [:b "footer"])
                           :content-props
                           {:align "start"
                            :class "w-48"}})))))])

(hsx/defc icon-picker-demo
  []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4.mb-8
    "UI X Emojis & Icons Picker"]

   [:div.border.rounded.bg-gray-01.overflow-hidden
    {:class "w-fit"}
    (icon-search {})]])

(hsx/defc popup-demo
  []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold.border-b.pb-4 "UI X Popup"]

   (let [[emoji set-emoji!] (hooks/use-state nil)
         [q set-q!] (hooks/use-state "")
         *q-ref (hooks/use-ref nil)

         emoji-picker
         (fn [_nested?]
           [:p.py-4
            "Choose a inline "
            [:a.underline
             {:on-click
              #(shui/popup-show! %
                               (fn [_config]
                                 [:div.max-h-72.overflow-auto.p-1
                                  (emojis-cp (take 80 emojis)
                                             {:on-chosen
                                              (fn [_ t]
                                                (set-emoji! t)
                                                (shui/popup-hide-all!))})])
                               {:content-props {:class "w-72 p-0"}
                                :as-dropdown? true})}
             (if emoji [:strong.px-1.text-6xl [:em-emoji emoji]] "emoji :O")] "."])]
     [:<>
      (emoji-picker nil)

      [:p.py-4
       (shui/button
        {:variant :secondary
         :on-click #(shui/popup-show! %
                                    (fn []
                                      [:p.p-4
                                       (emoji-picker true)]))}
        "Play a nested x popup.")]

      [:p.py-4
       (let [gen-content
             (fn [q]
               [:p.x-input-popup-content.bg-green-rx-06
                (shui/button {:on-click #(shui/toast! "Just a joke :)")} "play a magic")
                (emoji-picker true)
                [:strong.px-1.text-6xl q]])]
         (shui/input
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
                           (shui/popup-show! (.-target e)
                                           (gen-content q)
                                           {:id id
                                            :align "start"
                                            :content-props
                                            {:class "x-input-popup-content"
                                             :onPointerDownOutside
                                             (fn [^js e]
                                               (js/console.log "===>> onPointerDownOutside:" e (hooks/deref *q-ref))
                                               (when-let [q-ref (hooks/deref *q-ref)]
                                                 (let [^js target (or (.-relatedTarget e)
                                                                      (.-target e))]
                                                   (js/console.log "t:" target)
                                                   (when (and
                                                          (not (.contains q-ref target))
                                                          (not (.closest target ".x-input-popup-content")))
                                                     (shui/popup-hide! id)))))
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
       {:on-click #(shui/popup-show! %
                                   (->> (range 8)
                                        (map (fn [it]
                                               (shui/dropdown-menu-item
                                                {:on-select (fn []
                                                              (shui/toast! it)
                                                              (shui/popup-hide-all!))}
                                                [:strong it]))))
                                   {:as-dropdown? true
                                    :content-props {:class "w-48"}})
        :on-context-menu #(shui/popup-show! %
                                          [:h1.text-3xl.font-bold "hi x popup for custom context menu!"])}]])])

(hsx/defc custom-trigger-content
  []
  [:p
   [:code "more content"] [:br]
   (shui/input {:auto-focus true}) [:br]
   (shui/button "select sth")])

(hsx/defc sample-dropdown-trigger
  []

  [:div.py-4
   [:h1.text-3xl.font-bold.border-b.pb-4 "Sample dropdown/menu trigger"]
   [:div.py-4
    (shui/dropdown-menu
     (shui/dropdown-menu-trigger
      {:as-child true}
      (shui/trigger-child-wrap
       {:class "border p-6 border"}
       (custom-trigger-content)))
     (shui/dropdown-menu-content
      (shui/dropdown-menu-item "A item")
      (shui/dropdown-menu-item "B item")
      (shui/dropdown-menu-item "C item")))]])

(hsx/defc page
  []
  (sample-dropdown-trigger))
