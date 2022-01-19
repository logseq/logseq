(ns frontend.components.plugins-settings
  (:require [rum.core :as rum]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [cljs-bean.core :as bean]))

(rum/defc render-item-input
  [val {:keys [key type title default description]} update-setting!]

  [:div.desc-item.as-input
   [:h2.font-bold.text-md title]

   [:label.form-control
    [:small.pl-1 description]

    [:input.form-input
     {:type      (name type)
      :value     (or val default)
      :on-change #(update-setting! key (util/evalue %))}]]])

(rum/defc render-item-toggle
  [val {:keys [key title description default]} update-setting!]

  (let [val (if (boolean? val) val (boolean default))]
    [:div.desc-item.as-toggle
     [:h2.font-bold.text-md (str "#" key ":" title)]

     [:div.form-control
      [:label
       (ui/checkbox {:checked   val
                     :on-change #(update-setting! key (not val))})
       [:small.pl-1 description]]]]))

(rum/defc render-item-enum
  [val {:keys [key title description default enumChoices enumPicker]} update-setting!]

  (let [val     (or val default)
        vals    (into #{} (if (sequential? val) val [val]))
        options (map (fn [v] {:label v :value v
                              :selected (contains? vals v)}) enumChoices)
        picker  (keyword enumPicker)]
    [:div.desc-item.as-enum
     [:h2.font-bold.text-md (str "#" key ":" title)]

     [:div.form-control
      [(if (contains? #{:radio :checkbox} picker) :div :label)
       [:small.pl-1 description]

       (case picker
         :radio (ui/radio-list options #(update-setting! key %) nil)
         :checkbox (ui/checkbox-list options #(update-setting! key %) nil)
         ;; select
         (ui/select options #(update-setting! key %) nil))
       ]]]))

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
      [:div.cp__plugins-settings-inner

       [:h2.font-bold.text-2xl (str "⚙️ " (.. pl -options -name))]

       [:hr]

       ;; setting items
       (for [desc schema
             :let [key  (:key desc)
                   val  (get settings (keyword key))
                   type (keyword (:type desc))]]

         (condp contains? type
           #{:string :number} (render-item-input val desc update-setting!)
           #{:boolean} (render-item-toggle val desc update-setting!)
           #{:enum} (render-item-enum val desc update-setting!)

           [:p (str "Not Handled #" key)]))

       [:hr]
       ;;[:pre.p-2 (js/JSON.stringify (bean/->js schema) nil 2)]
       ;;[:pre.p-2 (js/JSON.stringify _settings nil 2)]
       ]

      ;; no settings
      [:h2.font-bold.text-lg "No Settings Schema"])))