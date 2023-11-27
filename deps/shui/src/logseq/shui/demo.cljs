(ns logseq.shui.demo
  (:require [rum.core :as rum]
            [logseq.shui.ui :as ui]
            [logseq.shui.form.core :refer [yup yup-resolver] :as form-core]
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

(rum/defc sample-form-basic
  []
  [:div.border.p-6.rounded.bg-gray-01
   (let [form-ctx (form-core/use-form
                    {:defaultValues {:username "" :agreement true :notification "all"}
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
                  {:default-value   (:value field)
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
        [:p.relative.px-2
         (ui/button {:type "submit" :class "absolute right-0 top-[-40px]"} "Submit")]]))])

(rum/defc page []
  [:div.p-10
   [:h1.text-3xl.font-bold "Logseq UI"]
   [:hr]

   ;; Button
   (section-item "Button"
     [:div.flex.flex-row.space-x-2
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
      (ui/button {:variant :destructive :size :sm} "Destructive")
      (ui/button {:class "primary-green" :size :sm} "Custom (.primary-green)")
      (ui/button
        {:variant :icon
         :size    :sm}
        [:a.flex.items-center.text-blue-rx-10.hover:text-blue-rx-10-alpha
         {:href "https://x.com/logseq" :target "_blank"}
         (ui/tabler-icon "brand-twitter" {:size 15})])])

   ;; Toast
   (section-item "Toast"
     [:div.flex.flex-row.space-x-2
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
                          [:p.flex.items-center.gap-2
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

   ;; Badge
   (section-item "Badge"
     [:div.flex.flex-row.space-x-2
      (ui/badge "Default")
      (ui/badge {:variant :outline} "Outline")
      (ui/badge {:variant :secondary} "Secondary")
      (ui/badge {:variant :destructive} "Destructive")
      (ui/badge {:class "primary-yellow"} "Custom (.primary-yellow)")])

   ;; Dropdown
   (section-item "Dropdown"
     [:<>
      (ui/dropdown-menu
        (ui/dropdown-menu-trigger
          (ui/button {:variant :outline}
            (ui/tabler-icon "list") "Open dropdown menu"))
        (sample-dropdown-menu-content))])

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
   [:div.grid.grid-cols-2.gap-16
    (section-item "Slider" (ui/slider))
    (section-item "Switch"
      (ui/switch {:size :sm :class "relative top-[-8px]"}))]

   ;; Form
   (section-item "Form"
     [:<>
      (sample-form-basic)])

   [:hr.mb-60]])
