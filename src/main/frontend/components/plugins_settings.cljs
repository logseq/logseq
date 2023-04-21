(ns frontend.components.plugins-settings
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [frontend.handler.plugin :as plugin-handler]
            [cljs-bean.core :as bean]
            [goog.functions :refer [debounce]]))

(defn- dom-purify
  [html opts]
  (try
    (js-invoke js/DOMPurify "sanitize" html (bean/->js opts))
    (catch js/Error e
      (js/console.warn e) html)))

(rum/defc html-content
  [html]
  [:div.html-content.pl-1.flex-1.text-sm
   {:dangerouslySetInnerHTML {:__html (dom-purify html nil)}}])

(rum/defc edit-settings-file
  [pid {:keys [class]}]
  [:a.text-sm.hover:underline
   {:class    class
    :on-click #(plugin-handler/open-settings-file-in-default-app! pid)}
   "Edit settings.json"])

(rum/defc render-item-input
  [val {:keys [key type title default description inputAs]} update-setting!]

  [:div.desc-item.as-input
   {:data-key key}
   [:h2 [:code key] (ui/icon "caret-right") [:strong title]]

   [:label.form-control
    (html-content description)

    (let [input-as (util/safe-lower-case (or inputAs (name type)))
          input-as (if (= input-as "string") :text (keyword input-as))]
      [(if (= input-as :textarea) :textarea :input)
       {:class        (util/classnames [{:form-input (not (contains? #{:color :range} input-as))}])
        :type         (name input-as)
        :defaultValue (or val default)
        :on-key-down  #(.stopPropagation %)
        :on-change    (debounce #(update-setting! key (util/evalue %)) 1000)}])]])

(rum/defc render-item-toggle
  [val {:keys [key title description default]} update-setting!]

  (let [val (if (boolean? val) val (boolean default))]
    [:div.desc-item.as-toggle
     {:data-key key}
     [:h2 [:code key] (ui/icon "caret-right") [:strong title]]

     [:label.form-control
      (ui/checkbox {:checked   val
                    :on-change #(update-setting! key (not val))})
      (html-content description)]]))

(rum/defc render-item-enum
  [val {:keys [key title description default enumChoices enumPicker]} update-setting!]

  (let [val (or val default)
        vals (into #{} (if (sequential? val) val [val]))
        options (map (fn [v] {:label    v :value v
                              :selected (contains? vals v)}) enumChoices)
        picker (keyword enumPicker)]
    [:div.desc-item.as-enum
     {:data-key key}
     [:h2 [:code key] (ui/icon "caret-right") [:strong title]]

     [:div.form-control
      [(if (contains? #{:radio :checkbox} picker) :div.wrap :label.wrap)
       (html-content description)

       (case picker
         :radio (ui/radio-list options #(update-setting! key %) nil)
         :checkbox (ui/checkbox-list options #(update-setting! key %) nil)
         ;; select
         (ui/select options (fn [_ value ] (update-setting! key value)) nil))
       ]]]))

(rum/defc render-item-object
  [_val {:keys [key title description _default]} pid]

  [:div.desc-item.as-object
   {:data-key key}
   [:h2 [:code key] (ui/icon "caret-right") [:strong title]]

   [:div.form-control
    (html-content description)
    [:div.pl-1 (edit-settings-file pid nil)]]])

(rum/defc render-item-heading
  [{:keys [key title description]}]

  [:div.heading-item
   {:data-key key}
   [:h2 title]
   (html-content description)])

(rum/defc settings-container
  [schema ^js pl]
  (let [^js plugin-settings (.-settings pl)
        pid (.-id pl)
        [settings, set-settings] (rum/use-state (bean/->clj (.toJSON plugin-settings)))
        update-setting! (fn [k v] (.set plugin-settings (name k) (bean/->js v)))]

    (rum/use-effect!
     (fn []
       (let [on-change (fn [^js s]
                         (when-let [s (bean/->clj s)]
                           (set-settings s)))]
         (.on plugin-settings "change" on-change)
         #(.off plugin-settings "change" on-change)))
     [pid])

    (if (seq schema)
      [:div.cp__plugins-settings-inner
       ;; settings.json
       [:span.edit-file
        (edit-settings-file pid nil)]

       ;; render items
       (for [desc schema
             :let [key (:key desc)
                   val (get settings (keyword key))
                   type (keyword (:type desc))
                   desc (update desc :description #(plugin-handler/markdown-to-html %))]]

         (condp contains? type
           #{:string :number} (render-item-input val desc update-setting!)
           #{:boolean} (render-item-toggle val desc update-setting!)
           #{:enum} (render-item-enum val desc update-setting!)
           #{:object} (render-item-object val desc pid)
           #{:heading} (render-item-heading desc)

           [:p (str "#Not Handled#" key)]))]

      ;; no settings
      [:h2.font-bold.text-lg.py-4.warning "No Settings Schema!"])))
