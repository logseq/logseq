(ns logseq.shui.demo
  (:require [dommy.core :refer-macros [sel1]]
            [logseq.shui.dialog.core :as dialog-core]
            [logseq.shui.form.core :refer [yup] :as form-core]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc section-item
  [title children]
  [:section.mb-4
   [:h2.text-xl.font-semibold.py-2.italic.opacity-50 title]
   [:div.py-4 children]])

(hsx/defc sample-dropdown-menu-content
  []
  (let [icon #(shui/tabler-icon (name %1) {:class "scale-90 pr-1 opacity-80"})]
    (shui/dropdown-menu-content
      {:class "w-56"
       :on-click (fn [^js e] (some-> (.-target e) (.-innerText)
                               (#(identity ["You select: " [:b.text-red-700 %1]])) (shui/toast! :info)))}
      (shui/dropdown-menu-label "My Account")
      (shui/dropdown-menu-separator)
      (shui/dropdown-menu-group
        ;; items
        (shui/dropdown-menu-item (icon :user) "Profile" (shui/dropdown-menu-shortcut "⌘P"))
        (shui/dropdown-menu-item (icon :brand-mastercard) [:span "Billing"] (shui/dropdown-menu-shortcut "⌘B"))
        (shui/dropdown-menu-item (icon :adjustments-alt) [:span "Settings"] (shui/dropdown-menu-shortcut "⌘,"))
        (shui/dropdown-menu-item (icon :keyboard) [:span "Keyboard shortcuts"]))
      (shui/dropdown-menu-separator)
      ;; group
      (shui/dropdown-menu-group
        ;; items
        (shui/dropdown-menu-item (icon :users) "Team")
        ;; sub menu
        (shui/dropdown-menu-sub
          (shui/dropdown-menu-sub-trigger
            (icon :user-plus) [:span "Invite users"])
          (shui/dropdown-menu-sub-content
            (shui/dropdown-menu-item (icon :mail) "Email")
            (shui/dropdown-menu-item (icon :message) "Message")
            (shui/dropdown-menu-item (icon :dots-circle-horizontal) "More...")))
        ;; menu item
        (shui/dropdown-menu-item (icon :plus) "New Team" (shui/dropdown-menu-shortcut "⌘+T")))
      (shui/dropdown-menu-separator)
      (shui/dropdown-menu-item (icon :brand-github) "GitHub")
      (shui/dropdown-menu-item {:disabled true} (icon :cloud) "Cloud API")
      (shui/dropdown-menu-separator)
      (shui/dropdown-menu-item (icon :logout) "Logout" (shui/dropdown-menu-shortcut "⌘+Q")))))

(hsx/defc sample-context-menu-content
  []
  (let [icon #(shui/tabler-icon (name %1) {:class "scale-90 pr-1 opacity-80"})]
    (shui/context-menu
      ;; trigger
      (shui/context-menu-trigger
        [:div.border.px-6.py-12.border-dashed.rounded.text-center.select-none
         {:key "ctx-menu-click"}
         [:span.opacity-50 "Right click here"]])
      ;; content
      (shui/context-menu-content
        {:class "w-60 max-h-[80vh] overflow-auto"}
        (shui/context-menu-item
          (icon "arrow-left")
          "Back"
          (shui/context-menu-shortcut "⌘["))
        (shui/context-menu-item {:disabled true}
          (icon "arrow-right")
          "Forward"
          (shui/context-menu-shortcut "⌘]"))
        (shui/context-menu-item
          (icon "refresh")
          "Reload"
          (shui/context-menu-shortcut "⌘R"))
        ;; Sub menu
        (shui/context-menu-sub
          (shui/context-menu-sub-trigger {:inset true} "More tools")
          (shui/context-menu-sub-content {:class "w-48"}
            (shui/context-menu-item "Save page As..."
              (shui/context-menu-shortcut "⇧⌘S"))
            (shui/context-menu-item "Create Shortcut...")
            (shui/context-menu-item "Name Window...")
            (shui/context-menu-separator)
            (shui/context-menu-item "Developer Tools")))
        ;; more
        (shui/context-menu-separator)
        (shui/context-menu-checkbox-item {:checked true}
          "Show Bookmarks Bar" (shui/context-menu-shortcut "⌘⇧B"))
        (shui/context-menu-checkbox-item "Show Full URLs")
        (shui/context-menu-separator)
        (shui/context-menu-radio-group {:value "pedro"}
          (shui/context-menu-label {:inset true} "People")
          (shui/context-menu-separator)
          (shui/context-menu-radio-item {:value "pedro"} "Pedro Duarte")
          (shui/context-menu-radio-item {:value "colm"} "Colm Tuite"))))))

(hsx/defc sample-tabs
  []
  (shui/tabs
    {:defaultValue "account"
     :className "w-[400px]"}
    (shui/tabs-list
      (shui/tabs-trigger
        {:value "account"}
        "Account")
      (shui/tabs-trigger
        {:value "password"}
        "Password"))
    (shui/tabs-content
      {:value "account"}
      "Make changes to your account here.")
    (shui/tabs-content
      {:value "password"}
      "Change your password here.")))

(hsx/defc sample-form-basic
  []
  [:div.border.p-6.rounded.bg-gray-01
   (let [form-ctx (form-core/use-form
                    {:defaultValues {:username ""
                                     :agreement true
                                     :notification "all"
                                     :bio ""}
                     :yupSchema (-> (.object yup)
                                  (.shape #js {:username (-> (.string yup) (.required))})
                                  (.required))})
         handle-submit (:handleSubmit form-ctx)
         on-submit-valid (handle-submit
                           (fn [^js e]
                             (js/console.log "[form] submit: " e)
                             (js/alert (js/JSON.stringify e nil 2))))]

     (shui/form-provider form-ctx
       [:form
        {:on-submit on-submit-valid}

        ;; field item
        (shui/form-field {:name "username"}
          (fn [field error]
            (shui/form-item
              (shui/form-label "Username")
              (shui/form-control
                (shui/input (merge {:placeholder "Username"} field)))
              (shui/form-description
                (if error
                  [:b.text-red-800 (:message error)]
                  "This is your public display name.")))))

        (shui/form-field {:name "bio"}
          (fn [field _error]
            (shui/form-item
              {:class "pt-4"}
              (shui/form-control
                (shui/textarea (merge {:placeholder "Bio text..."} field))))))

        ;; radio
        (shui/form-field {:name "notification"}
          ;; item render
          (fn [field]
            (shui/form-item
              {:class "space-y-3 my-4"}
              (shui/form-label "Notify me about...")
              (shui/form-control
                (shui/radio-group
                  {:value (:value field)
                   :on-value-change (:onChange field)
                   :class "flex flex-col space-y-3"}
                  (shui/form-item
                    {:class "flex flex-row space-x-3 items-center space-y-0"}
                    (shui/form-control
                      (shui/radio-group-item {:value "all"}))
                    (shui/form-label "All"))

                  (shui/form-item
                    {:class "flex flex-row space-x-3 items-center space-y-0"}
                    (shui/form-control
                      (shui/radio-group-item {:value "direct"}))
                    (shui/form-label "Direct messages and mentions")))))))

        [:hr]

        ;; checkbox
        (shui/form-field {:name "agreement"}
          (fn [field]
            (shui/form-item
              {:class "flex justify-start items-center space-x-3 space-y-0 my-3 pr-3"}
              (shui/form-control
                (shui/checkbox {:checked (:value field)
                                :on-checked-change (:onChange field)}))
              (shui/form-label {:class "font-normal cursor-pointer"} "Agreement terms"))))

        ;; actions
        [:div.relative.px-2
         (shui/button {:type "submit" :class "!absolute right-0 top-[-40px]"} "Submit")]]))])

(hsx/defc sample-date-picker
  []
  (let [[open? set-open!] (hooks/use-state false)
        [date set-date!] (hooks/use-state (js/Date.))]
    (shui/popover
      {:open open?
       :on-open-change (fn [o] (set-open! o))}
      ;; trigger
      (shui/popover-trigger
        {:as-child true
         :class "w-2/3"}
        (shui/input
          {:type :text
           :placeholder "pick a date"
           :default-value (.toDateString date)}))
      ;; content
      (shui/popover-content
        {:on-open-auto-focus #(.preventDefault %)
         :side-offset 8
         :class "p-0"}
        (shui/calendar
          {:selected date
           :on-day-click
           (fn [^js d]
             (set-date! d)
             (set-open! false))})))))

(hsx/defc sample-dialog-basic
  []
  (let [[open? set-open!] (hooks/use-state false)]
    (shui/dialog
      {:open open?
       :on-open-change #(set-open! %)}
      (shui/dialog-trigger
        {:as-child true}
        (shui/button {:variant :outline}
          (shui/tabler-icon "notification") "Open as modal locally"))
      (shui/dialog-content
        (shui/dialog-header
          (shui/dialog-title "Header")
          (shui/dialog-description
            "Description"))
        [:div.max-h-96.overflow-y-auto
         {:class "-mx-6"}
         [:section.px-6
          (repeat 8 [:p "Your custom content"])]]
        (shui/dialog-footer
          (shui/button
            {:on-click #(set-open! false)
             :size :md} "🍄 * Footer"))))))

(hsx/defc page []
  (shui/tooltip-provider
    [:div.sm:p-10
     [:hr]
     [:input
      {:type "checkbox" :on-change #(js/console.log "===>> onChange:" % (.-value (.-target %)))}]
     (shui/checkbox {:on-click
                     (fn [^js e] (js/console.log "==>> click:"
                                   (set! (. (.-target e) -checked) (.-state (.-dataset (.-target e))))
                                   (.-checked (.-target e))))
                     :on-checked-change #(js/console.log "==>> on checked change:" %)} "abc")

     [:h1.text-3xl.font-bold "Logseq UI"]
     [:hr]

     ;; Button
     (section-item "Button"
       [:div.flex.flex-row.flex-wrap.gap-2
        (let [[loading? set-loading!] (hooks/use-state false)]
          (shui/button
            {:size :sm
             :on-click (fn []
                         (set-loading! true)
                         (js/setTimeout #(set-loading! false) 5000))
             :disabled loading?}
            (when loading?
              (shui/tabler-icon "loader2" {:class "animate-spin"}))
            "Logseq Classic Button"
            (shui/tabler-icon "arrow-right")))

        (shui/button {:variant :outline :size :sm} "Outline")
        (shui/button {:variant :secondary :size :sm} "Secondary")
        (shui/button {:disabled true :size :sm} "Disabled")
        (shui/button {:variant :destructive :size :sm} "Destructive")
        (shui/button {:class "primary-green" :size :sm} "Custom (.primary-green)")
        (shui/button {:variant :ghost :size :sm} "Ghost")
        (shui/button {:variant :link :size :sm} "Link")
        (shui/button
          {:variant :icon
           :size :sm}
          [:a.flex.items-center.text-blue-rx-10.hover:text-blue-rx-10-alpha
           {:href "https://x.com/logseq" :target "_blank"}
           (shui/tabler-icon "brand-twitter" {:size 15})])])

     ;; Toast
     (section-item "Toast"
       [:div.flex.flex-row.flex-wrap.gap-2
        (shui/button
          {:size :md
           :variant :outline
           :on-click #(shui/toast!
                        "Check for updates ..."
                        (nth [:success :error :default :info :warning] (rand-int 3))
                        {:title (if (odd? (js/Date.now)) "History of China" "")
                         :duration 3000})}
          "Open random toast"
          (shui/tabler-icon "arrow-right"))

        (shui/button
          {:variant :secondary
           :size :md
           :on-click (fn []
                       (shui/toast!
                         (fn [{:keys [id dismiss! update!]}]
                           [:b.text-red-700
                            [:div.flex.items-center.gap-2
                             (shui/tabler-icon "info-circle")
                             (str "#(" id ") ")
                             (.toLocaleString (js/Date.))]
                            [:div.flex.flex-row.gap-2
                             (shui/button
                               {:on-click #(dismiss! id) :size :sm}
                               "x close")

                             (shui/button
                               {:on-click #(update! {:title (js/Date.now)
                                                     :action [:b (shui/button {:on-click (fn [] (shui/toast-dismiss!))} "clear all")]})
                                :size :sm}
                               "x update")]])
                         :default
                         {:duration 3000 :onDismiss #(js/console.log "===>> dismiss?:" %1)}))}
          (shui/tabler-icon "apps")
          "Toast callback handle")

        (shui/button
          {:on-click #(shui/toast! "A message from SoundCloud..."
                        {:class "text-orange-rx-10"
                         :icon [:b.pl-1 (shui/tabler-icon "brand-soundcloud" {:size 20})]
                         :duration 3000})
           :class "primary-orange"
           :size :md}
          "Custom icon")])

     [:div.flex.flex-row.space-x-16.items-center
      ;; Tips
      (section-item "Tips"
        [:div.flex.flex-row.flex-wrap.gap-2
         (shui/tooltip-provider
           (shui/tooltip
             (shui/tooltip-trigger
               (shui/button
                 {:variant :outline
                  :on-click #(dialog-core/open! [:h1.text-9xl.text-center.scale-110 "🍄"])}
                 "Tip for hint?"))
             (shui/tooltip-content
               {:class "w-42 px-8 py-4 text-xl border-green-rx-08 bg-green-rx-07-alpha"}
               "🍄")))])
      ;; Avatar
      (section-item "Avatar"
        [:div.flex.flex-row.space-x-6.items-center
         (shui/avatar
           (shui/avatar-image {:src "https://avatars.githubusercontent.com/u/63385289?s=200&v=4"})
           (shui/avatar-fallback "L"))
         (shui/avatar
           (shui/avatar-fallback "CH"))])]

     ;; Badge
     (section-item "Badge"
       [:div.flex.flex-row.flex-wrap.gap-2
        (shui/badge "Default")
        (shui/badge {:variant :outline} "Outline")
        (shui/badge {:variant :secondary} "Secondary")
        (shui/badge {:variant :destructive} "Destructive")
        (shui/badge {:class "primary-yellow"} "Custom (.primary-yellow)")])

     [:div.grid.sm:grid-cols-3.sm:gap-8
      ;; Dropdown
      (section-item "Dropdown"
        (shui/dropdown-menu
          (shui/tooltip
            (shui/tooltip-trigger
              (shui/dropdown-menu-trigger
                {:as-child true}
                (shui/button {:variant :outline}
                  (shui/tabler-icon "list") "Open dropdown menu")))
            (shui/tooltip-content "test hide?"))

          (sample-dropdown-menu-content)))

      ;; Context menu
      [:div.col-span-2
       (section-item "Context Menu"
         (sample-context-menu-content))]]

     (section-item "Tabs" (sample-tabs))

     ;; Dialog
     (section-item "Dialog"
       [:div.flex.flex-row.flex-wrap.gap-2
        (sample-dialog-basic)
        (let [fc #(dialog-core/open!
                    (fn []
                      [:div.py-2
                       [:p [:strong "a modal dialog from `open!`"]]
                       [:p "You can put any content here, and even use shui components!"]
                       [:p (shui/button {:on-click (fn [] (dialog-core/alert! [:p "nest"] {}))} "open nested dialog")]])
                    {:title "Title"})]
          (shui/button
            {:on-click fc}
            "Imperative API: open!"))

        (shui/button
          {:class "primary-yellow"
           :on-click (fn []
                       (-> (dialog-core/alert!
                             "a alert dialog from `alert!`"
                             {:title [:div.flex.flex-row.space-x-2.items-center
                                      (shui/tabler-icon "alert-triangle" {:size 18})
                                      [:span "Alert"]]})
                         (p/then #(js/console.log "=> alert (promise): " %))))}
          "Imperative API: alert!")

        (shui/button
          {:class "primary-green"
           :on-click (fn []
                       (-> (dialog-core/confirm!
                             "a alert dialog from `confirm!`"
                             {:title [:div.flex.flex-row.space-x-2.items-center
                                      (shui/tabler-icon "alert-triangle" {:size 18})
                                      [:span "Confirm"]]})
                         (p/then #(js/console.log "=> confirm (promise): " %))
                         (p/catch #(js/console.log "=> confirm (promise): " %))))}
          "Imperative API: confirm!")])

     ;; Alert
     (section-item "Alert"
       [:<>
        (shui/alert
          {:class "text-orange-rx-09 border-orange-rx-07-alpha mb-4"}
          (shui/tabler-icon "brand-soundcloud")
          (shui/alert-title "Title is SoundCloud")
          (shui/alert-description
            "content: radix colors for Logseq"))
        (shui/alert
          (shui/tabler-icon "brand-github")
          (shui/alert-title "GitHub")
          (shui/alert-description
            "content: radix colors for Logseq"))])

     ;; Slider
     [:div.grid.sm:grid-cols-8.gap-4
      [:div.col-span-4.mr-6
       (section-item "Slider" (shui/slider))]
      [:div.col-span-1
       (section-item "Switch"
         (shui/switch {:size :sm :class "relative top-[-8px]"}))]
      [:div.col-span-3.pl-4.pr-2
       (section-item "Select"
         (shui/select
           {:on-value-change (fn [v] (shui/toast! v :info))}
           ;; trigger
           (shui/select-trigger
             (shui/select-value {:placeholder "Select a fruit"}))
           ;; content
           (shui/select-content
             (shui/select-group
               (shui/select-label "Fruits")
               (shui/select-item {:value "apple"} "Apple")
               (shui/select-item {:value "pear"} "Pear")
               (shui/select-item {:value "grapes"} "Grapes")))))]]

     ;; Form
     (section-item "Form"
       [:<>
        (sample-form-basic)])

     ;; Card
     [:div.grid.sm:grid-cols-2.sm:gap-8
      (section-item "Card"
        (shui/card
          (shui/card-header
            (shui/card-title "Title")
            (shui/card-description "Description"))
          (shui/card-content "This is content")
          (shui/card-footer "Footer")))

      (section-item "Skeleton"
        (shui/card
          (shui/card-header
            (shui/card-title
              (shui/skeleton {:class "h-4 w-1/2"}))
            (shui/card-description
              (shui/skeleton {:class "h-2 w-full"})))
          (shui/card-content
            (shui/skeleton {:class "h-3 mb-1"})
            (shui/skeleton {:class "h-3 mb-1"})
            (shui/skeleton {:class "h-3 w-2/3"}))

          (shui/card-footer
            (shui/skeleton {:class "h-4 w-full mb-2"}))))]

     ;; Calendar
     [:div.grid.sm:grid-cols-2.sm:gap-8
      (section-item "Calendar"
        (shui/card
          {:class "inline-flex"}
          (shui/calendar {:on-day-click #(shui/toast! (.toString %) :success)})))
      (section-item "Date Picker"
        (sample-date-picker))]

     [:hr.mb-80]]))

(defn- get-head-container
  []
  (sel1 "#head"))

(defn- get-main-scroll-container
  []
  (sel1 "#main-content-container"))

(hsx/defc sticky-table
  []

  (let [el-ref (hooks/use-ref nil)]
    (hooks/use-effect!
      (fn []
        (let [^js container (get-main-scroll-container)
              ^js el (hooks/deref el-ref)
              ^js cls (.-classList el)
              *ticking? (volatile! false)
              el-top (-> el (.getBoundingClientRect) (.-top))
              head-top (-> (get-head-container) (js/getComputedStyle) (.-height) (js/parseInt))
              translate (fn [offset]
                          (set! (. (.-style el) -transform) (str "translate3d(0, " offset "px , 0)"))
                          (if (zero? offset)
                            (.remove cls "translated")
                            (.add cls "translated")))
              *last-offset (volatile! 0)
              handle (fn []
                       (let [scroll-top (js/parseInt (.-scrollTop container))
                             offset (if (> (+ scroll-top head-top) el-top)
                                      (+ (- scroll-top el-top) head-top 1) 0)
                             offset (js/parseInt offset)
                             last-offset @*last-offset]
                         (if (and (not (zero? last-offset))
                               (not= offset last-offset))
                           (let [dir (if (neg? (- offset last-offset)) -1 1)]
                             (loop [offset' (+ last-offset dir)]
                               (translate offset')
                               (if (and (not= offset offset')
                                     (< (abs (- offset offset')) 100))
                                 (recur (+ offset' dir))
                                 (translate offset))))
                           (translate offset))
                         (vreset! *last-offset offset)))
              handler (fn [^js _e]
                        (when (not @*ticking?)
                          (js/window.requestAnimationFrame
                            #(do (handle) (vreset! *ticking? false)))
                          (vreset! *ticking? true)))]
          (.addEventListener container "scroll" handler)
          #(.removeEventListener container "scroll" handler)))
      [])

    [:div.charlie-table
     [:div.charlie-table-header
      {:ref el-ref}
      [:strong "header"]]
     [:div.charlie-table-content
      [:strong "content"]]]))
