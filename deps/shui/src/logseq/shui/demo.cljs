(ns logseq.shui.demo
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]
            [logseq.shui.form.core :refer [yup yup-resolver] :as form-core]
            [promesa.core :as p]
            [logseq.shui.dialog.core :as dialog-core]
            [cljs-bean.core :as bean]))

(rum/defc section-item
  [title children]
  [:section.mb-4
   [:h2.text-xl.font-semibold.py-2.italic.opacity-50 title]
   [:div.py-4 children]])

(rum/defc sample-dropdown-menu-content
  []
  (let [icon #(ui/tabler-icon (name %1) {:class "scale-90 pr-1 opacity-80"})]
    (ui/dropdown-menu-content
      {:class    "w-56"
       :on-click (fn [^js e] (some-> (.-target e) (.-innerText)
                               (#(identity ["You select: " [:b.text-red-700 %1]])) (ui/toast! :info)))}
      (ui/dropdown-menu-label "My Account")
      (ui/dropdown-menu-separator)
      (ui/dropdown-menu-group
        ;; items
        (ui/dropdown-menu-item (icon :user) "Profile" (ui/dropdown-menu-shortcut "⌘P"))
        (ui/dropdown-menu-item (icon :brand-mastercard) [:span "Billing"] (ui/dropdown-menu-shortcut "⌘B"))
        (ui/dropdown-menu-item (icon :adjustments-alt) [:span "Settings"] (ui/dropdown-menu-shortcut "⌘,"))
        (ui/dropdown-menu-item (icon :keyboard) [:span "Keyboard shortcuts"]))
      (ui/dropdown-menu-separator)
      ;; group
      (ui/dropdown-menu-group
        ;; items
        (ui/dropdown-menu-item (icon :users) "Team")
        ;; sub menu
        (ui/dropdown-menu-sub
          (ui/dropdown-menu-sub-trigger
            (icon :user-plus) [:span "Invite users"])
          (ui/dropdown-menu-sub-content
            (ui/dropdown-menu-item (icon :mail) "Email")
            (ui/dropdown-menu-item (icon :message) "Message")
            (ui/dropdown-menu-item (icon :dots-circle-horizontal) "More...")))
        ;; menu item
        (ui/dropdown-menu-item (icon :plus) "New Team" (ui/dropdown-menu-shortcut "⌘+T")))
      (ui/dropdown-menu-separator)
      (ui/dropdown-menu-item (icon :brand-github) "GitHub")
      (ui/dropdown-menu-item {:disabled true} (icon :cloud) "Cloud API")
      (ui/dropdown-menu-separator)
      (ui/dropdown-menu-item (icon :logout) "Logout" (ui/dropdown-menu-shortcut "⌘+Q"))
      )))

(rum/defc sample-context-menu-content
  []
  (let [icon #(ui/tabler-icon (name %1) {:class "scale-90 pr-1 opacity-80"})]
    (ui/context-menu
      ;; trigger
      (ui/context-menu-trigger
        [:div.border.px-6.py-12.border-dashed.rounded.text-center.select-none
         {:key "ctx-menu-click"}
         [:span.opacity-50 "Right click here"]])
      ;; content
      (ui/context-menu-content
        {:class "w-60 max-h-[80vh] overflow-auto"}
        (ui/context-menu-item
          (icon "arrow-left")
          "Back"
          (ui/context-menu-shortcut "⌘["))
        (ui/context-menu-item {:disabled true}
          (icon "arrow-right")
          "Forward"
          (ui/context-menu-shortcut "⌘]"))
        (ui/context-menu-item
          (icon "refresh")
          "Reload"
          (ui/context-menu-shortcut "⌘R"))
        ;; Sub menu
        (ui/context-menu-sub
          (ui/context-menu-sub-trigger {:inset true} "More tools")
          (ui/context-menu-sub-content {:class "w-48"}
            (ui/context-menu-item "Save page As..."
              (ui/context-menu-shortcut "⇧⌘S"))
            (ui/context-menu-item "Create Shortcut...")
            (ui/context-menu-item "Name Window...")
            (ui/context-menu-separator)
            (ui/context-menu-item "Developer Tools")))
        ;; more
        (ui/context-menu-separator)
        (ui/context-menu-checkbox-item {:checked true}
          "Show Bookmarks Bar" (ui/context-menu-shortcut "⌘⇧B"))
        (ui/context-menu-checkbox-item "Show Full URLs")
        (ui/context-menu-separator)
        (ui/context-menu-radio-group {:value "pedro"}
          (ui/context-menu-label {:inset true} "People")
          (ui/context-menu-separator)
          (ui/context-menu-radio-item {:value "pedro"} "Pedro Duarte")
          (ui/context-menu-radio-item {:value "colm"} "Colm Tuite"))))))

(rum/defc sample-form-basic
  []
  [:div.border.p-6.rounded.bg-gray-01
   (let [form-ctx (form-core/use-form
                    {:defaultValues {:username     ""
                                     :agreement    true
                                     :notification "all"
                                     :bio          ""}
                     :yupSchema     (-> (.object yup)
                                      (.shape #js {:username (-> (.string yup) (.required))})
                                      (.required))})
         handle-submit (:handleSubmit form-ctx)
         on-submit-valid (handle-submit
                           (fn [^js e]
                             (js/console.log "[form] submit: " e)
                             (js/alert (js/JSON.stringify e nil 2))))]

     (ui/form-provider form-ctx
       [:form
        {:on-submit on-submit-valid}

        ;; field item
        (ui/form-field {:name "username"}
          (fn [field error]
            (ui/form-item
              (ui/form-label "Username")
              (ui/form-control
                (ui/input (merge {:placeholder "Username"} field)))
              (ui/form-description
                (if error
                  [:b.text-red-800 (:message error)]
                  "This is your public display name.")))))

        (ui/form-field {:name "bio"}
          (fn [field error]
            (ui/form-item
              {:class "pt-4"}
              (ui/form-control
                (ui/textarea (merge {:placeholder "Bio text..."} field))))))

        ;; radio
        (ui/form-field {:name "notification"}
          ;; item render
          (fn [field]
            (ui/form-item
              {:class "space-y-3 my-4"}
              (ui/form-label "Notify me about...")
              (ui/form-control
                (ui/radio-group
                  {:value           (:value field)
                   :on-value-change (:onChange field)
                   :class           "flex flex-col space-y-3"}
                  (ui/form-item
                    {:class "flex flex-row space-x-3 items-center space-y-0"}
                    (ui/form-control
                      (ui/radio-group-item {:value "all"}))
                    (ui/form-label "All"))

                  (ui/form-item
                    {:class "flex flex-row space-x-3 items-center space-y-0"}
                    (ui/form-control
                      (ui/radio-group-item {:value "direct"}))
                    (ui/form-label "Direct messages and mentions")))))))

        [:hr]

        ;; checkbox
        (ui/form-field {:name "agreement"}
          (fn [field]
            (ui/form-item
              {:class "flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
              (ui/form-control
                (ui/checkbox {:checked           (:value field)
                              :on-checked-change (:onChange field)}))
              (ui/form-label {:class "font-normal cursor-pointer"} "Agreement terms"))))

        ;; actions
        [:div.relative.px-2
         (ui/button {:type "submit" :class "!absolute right-0 top-[-40px]"} "Submit")]]))])

(rum/defc sample-date-picker
  []
  (let [[open? set-open!] (rum/use-state false)
        [date set-date!] (rum/use-state (js/Date.))]
    (ui/popover
      {:open           open?
       :on-open-change (fn [o] (set-open! o))}
      ;; trigger
      (ui/popover-trigger
        {:as-child true
         :class    "w-2/3"}
        (ui/input
          {:type          :text
           :placeholder   "pick a date"
           :default-value (.toDateString date)}))
      ;; content
      (ui/popover-content
        {:on-open-auto-focus #(.preventDefault %)
         :side-offset        8
         :class              "p-0"}
        (ui/calendar
          {:selected date
           :on-day-click
           (fn [^js d]
             (set-date! d)
             (set-open! false))})))))

(rum/defc sample-dialog-basic
  []
  (let [[open? set-open!] (rum/use-state false)]
    (ui/dialog
      {:open           open?
       :on-open-change #(set-open! %)}
      (ui/dialog-trigger
        {:as-child true}
        (ui/button {:variant :outline}
          (ui/tabler-icon "notification") "Open as modal locally"))
      (ui/dialog-content
        (ui/dialog-header
          (ui/dialog-title "Header")
          (ui/dialog-description
            "Description"))
        [:div.max-h-96.overflow-y-auto
         {:class "-mx-6"}
         [:section.px-6
          (repeat 8 [:p "Your custom content"])]]
        (ui/dialog-footer
          (ui/button
            {:on-click #(set-open! false)
             :size     :md} "🍄 * Footer"))))))

(rum/defc page []
  [:div.sm:p-10
   [:h1.text-3xl.font-bold "Logseq UI"]
   [:hr]

   ;; Button
   (section-item "Button"
     [:div.flex.flex-row.flex-wrap.gap-2
      (let [[loading? set-loading!] (rum/use-state false)]
        (ui/button
          {:size     :sm
           :on-click (fn []
                       (set-loading! true)
                       (js/setTimeout #(set-loading! false) 5000))
           :disabled loading?}
          (when loading?
            (ui/tabler-icon "loader2" {:class "animate-spin"}))
          "Logseq Classic Button"
          (ui/tabler-icon "arrow-right")))

      (ui/button {:variant :outline :size :sm} "Outline")
      (ui/button {:variant :secondary :size :sm} "Secondary")
      (ui/button {:disabled true :size :sm} "Disabled")
      (ui/button {:variant :destructive :size :sm} "Destructive")
      (ui/button {:class "primary-green" :size :sm} "Custom (.primary-green)")
      (ui/button {:variant :ghost :size :sm} "Ghost")
      (ui/button {:variant :link :size :sm} "Link")
      (ui/button
        {:variant :icon
         :size    :sm}
        [:a.flex.items-center.text-blue-rx-10.hover:text-blue-rx-10-alpha
         {:href "https://x.com/logseq" :target "_blank"}
         (ui/tabler-icon "brand-twitter" {:size 15})]
        )])

   ;; Toast
   (section-item "Toast"
     [:div.flex.flex-row.flex-wrap.gap-2
      (ui/button
        {:size     :md
         :variant  :outline
         :on-click #(ui/toast!
                      "Check for updates ..."
                      (nth [:success :error :default :info :warning] (rand-int 3))
                      {:title    (if (odd? (js/Date.now)) "History of China" "")
                       :duration 3000})}
        "Open random toast"
        (ui/tabler-icon "arrow-right"))

      (ui/button
        {:variant  :secondary
         :size     :md
         :on-click (fn []
                     (ui/toast!
                       (fn [{:keys [id dismiss! update!]}]
                         [:b.text-red-700
                          [:div.flex.items-center.gap-2
                           (ui/tabler-icon "info-circle")
                           (str "#(" id ") ")
                           (.toLocaleString (js/Date.))]
                          [:div.flex.flex-row.gap-2
                           (ui/button
                             {:on-click #(dismiss! id) :size :sm}
                             "x close")

                           (ui/button
                             {:on-click #(update! {:title  (js/Date.now)
                                                   :action [:b (ui/button {:on-click (fn [] (ui/toast-dismiss!))} "clear all")]})
                              :size     :sm}
                             "x update")]])
                       :default
                       {:duration 3000 :onDismiss #(js/console.log "===>> dismiss?:" %1)}))}
        (ui/tabler-icon "apps")
        "Toast callback handle")

      (ui/button
        {:on-click #(ui/toast! "A message from SoundCloud..."
                      {:class    "text-orange-rx-10"
                       :icon     [:b.pl-1 (ui/tabler-icon "brand-soundcloud" {:size 20})]
                       :duration 3000})
         :class    "primary-orange"
         :size     :md}
        "Custom icon")])

   ;; Tips
   (section-item "Tips"
     [:div.flex.flex-row.flex-wrap.gap-2
      (ui/tooltip-provider
        (ui/tooltip
          (ui/tooltip-trigger
            (ui/button
              {:variant  :outline
               :on-click #(dialog-core/open! [:h1.text-9xl.text-center.scale-110 "🍄"])}
              "Tip for hint?"))
          (ui/tooltip-content
            {:class "w-42 px-8 py-4 text-xl border-green-rx-08 bg-green-rx-07-alpha"}
            "🍄")))])

   ;; Badge
   (section-item "Badge"
     [:div.flex.flex-row.flex-wrap.gap-2
      (ui/badge "Default")
      (ui/badge {:variant :outline} "Outline")
      (ui/badge {:variant :secondary} "Secondary")
      (ui/badge {:variant :destructive} "Destructive")
      (ui/badge {:class "primary-yellow"} "Custom (.primary-yellow)")])

   [:div.grid.sm:grid-cols-3.sm:gap-8
    ;; Dropdown
    (section-item "Dropdown"
      (ui/dropdown-menu
        (ui/dropdown-menu-trigger
          {:as-child true}
          (ui/button {:variant :outline}
            (ui/tabler-icon "list") "Open dropdown menu"))
        (sample-dropdown-menu-content)))

    ;; Context menu
    [:div.col-span-2
     (section-item "Context Menu"
       (sample-context-menu-content))]]

   ;; Dialog
   (section-item "Dialog"
     [:div.flex.flex-row.flex-wrap.gap-2
      (sample-dialog-basic)
      (ui/button
        {:on-click #(dialog-core/open! "a modal dialog from `open!`" {:title "Title"})}
        "Imperative API: open!")

      (ui/button
        {:class    "primary-yellow"
         :on-click (fn []
                     (-> (dialog-core/alert!
                           "a alert dialog from `alert!`"
                           {:title [:div.flex.flex-row.space-x-2.items-center
                                    (ui/tabler-icon "alert-triangle" {:size 18})
                                    [:span "Alert"]]})
                       (p/then #(js/console.log "=> alert (promise): " %))))}
        "Imperative API: alert!")

      (ui/button
        {:class    "primary-green"
         :on-click (fn []
                     (-> (dialog-core/confirm!
                           "a alert dialog from `confirm!`"
                           {:title [:div.flex.flex-row.space-x-2.items-center
                                    (ui/tabler-icon "alert-triangle" {:size 18})
                                    [:span "Confirm"]]})
                       (p/then #(js/console.log "=> confirm (promise): " %))
                       (p/catch #(js/console.log "=> confirm (promise): " %))))}
        "Imperative API: confirm!")])

   ;; Alert
   (section-item "Alert"
     [:<>
      (ui/alert
        {:class "text-orange-rx-09 border-orange-rx-07-alpha mb-4"}
        (ui/tabler-icon "brand-soundcloud")
        (ui/alert-title "Title is SoundCloud")
        (ui/alert-description
          "content: radix colors for Logseq"))
      (ui/alert
        (ui/tabler-icon "brand-github")
        (ui/alert-title "GitHub")
        (ui/alert-description
          "content: radix colors for Logseq"))])

   ;; Slider
   [:div.grid.sm:grid-cols-8.gap-4
    [:div.col-span-4.mr-6
     (section-item "Slider" (ui/slider))]
    [:div.col-span-1
     (section-item "Switch"
       (ui/switch {:size :sm :class "relative top-[-8px]"}))]
    [:div.col-span-3.pl-4.pr-2
     (section-item "Select"
       (ui/select
         {:on-value-change (fn [v] (ui/toast! v :info))}
         ;; trigger
         (ui/select-trigger
           (ui/select-value {:placeholder "Select a fruit"}))
         ;; content
         (ui/select-content
           (ui/select-group
             (ui/select-label "Fruits")
             (ui/select-item {:value "apple"} "Apple")
             (ui/select-item {:value "pear"} "Pear")
             (ui/select-item {:value "grapes"} "Grapes")

             ))))]]

   ;; Form
   (section-item "Form"
     [:<>
      (sample-form-basic)])

   ;; Card
   [:div.grid.sm:grid-cols-2.sm:gap-8
    (section-item "Card"
      (ui/card
        (ui/card-header
          (ui/card-title "Title")
          (ui/card-description "Description"))
        (ui/card-content "This is content")
        (ui/card-footer "Footer")))

    (section-item "Skeleton"
      (ui/card
        (ui/card-header
          (ui/card-title
            (ui/skeleton {:class "h-4 w-1/2"}))
          (ui/card-description
            (ui/skeleton {:class "h-2 w-full"})))
        (ui/card-content
          (ui/skeleton {:class "h-3 mb-1"})
          (ui/skeleton {:class "h-3 mb-1"})
          (ui/skeleton {:class "h-3 w-2/3"}))

        (ui/card-footer
          (ui/skeleton {:class "h-4 w-full mb-2"}))))]

   ;; Calendar
   [:div.grid.sm:grid-cols-2.sm:gap-8
    (section-item "Calendar"
      (ui/card
        {:class "inline-flex"}
        (ui/calendar {:on-day-click #(ui/toast! (.toString %) :success)})))
    (section-item "Date Picker"
      (sample-date-picker))]

   [:hr.mb-80]])
