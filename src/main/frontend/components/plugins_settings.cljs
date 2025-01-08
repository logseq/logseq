(ns frontend.components.plugins-settings
  (:require [cljs-bean.core :as bean]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [frontend.hooks :as hooks]))

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
  [pid {:keys [class edit-mode set-edit-mode!]}]
  [:a.text-sm.hover:underline
   {:class    class
    :on-click (fn []
                (if (util/electron?)
                  (plugin-handler/open-settings-file-in-default-app! pid)
                  (set-edit-mode! #(if % nil :code))))}
   (if (= edit-mode :code)
     "Exit code mode"
     "Edit settings.json")])

(rum/defc render-item-input
  [val {:keys [key type title default description inputAs]} update-setting!]

  [:div.desc-item.as-input
   {:data-key key :key key}
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
         (ui/select options (fn [_ value] (update-setting! key value))))]]]))

(rum/defc render-item-object
  [_val {:keys [key title description _default]} pid]

  [:div.desc-item.as-object
   {:data-key key}
   [:h2 [:code key] (ui/icon "caret-right") [:strong title]]

   [:div.form-control
    (html-content description)
    (when (util/electron?)
      [:div.pl-1 (edit-settings-file pid nil)])]])

(rum/defc render-item-heading
  [{:keys [key title description]}]

  [:div.heading-item
   {:data-key key}
   [:h2 title]
   (html-content description)])

(rum/defc render-item-not-handled
  [s]
  [:p.text-red-500 (str "#Not Handled# " s)])

(rum/defc settings-container
  [schema ^js pl]
  (let [^js plugin-settings (.-settings pl)
        pid (.-id pl)
        [settings, set-settings!] (rum/use-state (bean/->clj (.toJSON plugin-settings)))
        [edit-mode, set-edit-mode!] (rum/use-state nil) ;; code
        update-setting! (fn [k v] (.set plugin-settings (name k) (bean/->js v)))]

    (hooks/use-effect!
     (fn []
       (let [on-change (fn [^js s]
                         (when-let [s (bean/->clj s)]
                           (set-settings! s)))]
         (.on plugin-settings "change" on-change)
         #(.off plugin-settings "change" on-change)))
     [pid])

    (if (seq schema)
      [:<>
       [:h2.text-xl.px-2.pt-1.opacity-90 "ID: " pid]
       [:div.cp__plugins-settings-inner
        {:data-mode (some-> edit-mode (name))}
        ;; settings.json
        [:span.edit-file
         (edit-settings-file pid {:set-edit-mode! set-edit-mode!
                                  :edit-mode edit-mode})]

        (if (= edit-mode :code)
          ;; render with code editor
          [:div.code-mode-wrap.pl-3.pr-1.py-1.mb-8.-ml-1
           (let [content' (js/JSON.stringify (bean/->js settings) nil 2)]
             (lazy-editor/editor {:file? false}
                                 (str "code-edit-lsp-settings")
                                 {:data-lang "json"}
                                 content' {}))
           [:div.flex.justify-end.pt-2.gap-2
            (shui/button {:size :sm :variant :ghost
                          :on-click (fn [^js e]
                                      (let [^js cm (util/get-cm-instance (-> (.-target e) (.closest ".code-mode-wrap")))
                                            content' (some-> (.toJSON plugin-settings) (js/JSON.stringify nil 2))]
                                        (.setValue cm content')))}
                         "Reset")
            (shui/button {:size :sm
                          :on-click (fn [^js e]
                                      (try
                                        (let [^js cm (util/get-cm-instance (-> (.-target e) (.closest ".code-mode-wrap")))
                                              content (.getValue cm)
                                              content' (js/JSON.parse content)]
                                          (set! (. plugin-settings -settings) content')
                                          (set-edit-mode! nil))
                                        (catch js/Error e
                                          (notification/show! (.-message e) :error))))}
                         "Save")]]

          ;; render with gui items
          (for [desc schema
                :let [key (:key desc)
                      val (get settings (keyword key))
                      type (keyword (:type desc))
                      desc (update desc :description #(plugin-handler/markdown-to-html %))]]

            (rum/with-key
              (condp contains? type
                #{:string :number} (render-item-input val desc update-setting!)
                #{:boolean} (render-item-toggle val desc update-setting!)
                #{:enum} (render-item-enum val desc update-setting!)
                #{:object} (render-item-object val desc pid)
                #{:heading} (render-item-heading desc)

                (render-item-not-handled key))
              key)))]]

      ;; no settings
      [:h2.font-bold.text-lg.py-4.warning "No Settings Schema!"])))
