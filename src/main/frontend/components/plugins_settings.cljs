(ns frontend.components.plugins-settings
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [cljs-bean.core :as bean]))

(rum/defc render-item-input
  [val {:keys [key type title default]} update-setting!]

  [:div.desc-item-input
   [:h2.font-bold.text-md title]

   [:div.form-control
    [:input.form-input
     {:type      (name type)
      :value     (or val default)
      :on-change #(update-setting! key (.-value (.-target %)))}]]])

(rum/defc settings-container
  [schema ^js pl]
  (let [^js _settings   (.-settings pl)
        [settings, set-settings] (rum/use-state (bean/->clj (.toJSON _settings)))
        update-setting! (fn [k v] (.set _settings (name k) (bean/->js v)))]

    (rum/use-effect!
      (fn []
        (let [on-change (fn [^js s]
                          (when-let [s (bean/->clj s)]
                            (set-settings s)))]
          (.on _settings "change" on-change)
          #(.off _settings "change" on-change)))
      [])

    (if (seq schema)
      [:div.ui__plugin-settings-inner

       [:h2.font-bold.text-lg (str "#" (.. pl -options -name))]

       ;; setting items
       (for [desc schema
             :let [key  (:key desc)
                   val  (get settings (keyword key))
                   type (keyword (:type desc))]]

         (condp contains? type
           #{:string :number} (render-item-input val desc update-setting!)

           [:p (str "Not Handled #" key)]))

       [:hr]
       [:pre.p-2 (js/JSON.stringify (bean/->js schema) nil 2)]
       [:pre.p-2 (js/JSON.stringify _settings nil 2)]]

      ;; no settings
      [:h2.font-bold.text-lg "No Settings Schema"])))