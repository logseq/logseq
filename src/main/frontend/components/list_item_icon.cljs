(ns frontend.components.list-item-icon
  (:require
   [logseq.shui.ui :as shui]
   [rum.core :as rum]))

(rum/defc root
  "List item icon component with 4 variants:
   - :default - Dark gray background for regular search results
   - :create - Blue background with border for create actions
   - :raw - No visible background, icon with opacity for slash commands
   - :checkbox - Checkbox variant for multi-select
   
   Props:
   - variant - one of :default, :create, :raw, :checkbox
   - icon - icon name (for non-checkbox variants)
   - checked? - boolean for checkbox variant
   - on-checked-change - callback for checkbox variant
   - size - optional icon size override
   - class - optional additional classes"
  [{:keys [variant icon checked? on-checked-change size class]
    :or {variant :default}}]
  (case variant
    :default
    [:div.list-item-icon.list-item-icon--default
     {:class (str "w-5 h-5 rounded flex items-center justify-center " (or class ""))}
     (when icon
       (shui/tabler-icon icon {:size (or size "14") :class ""}))]

    :create
    [:div.list-item-icon.list-item-icon--create
     {:class (str "w-5 h-5 rounded flex items-center justify-center " (or class ""))}
     (when icon
       (shui/tabler-icon icon {:size (or size "14") :class ""}))]

    :raw
    [:div.list-item-icon.list-item-icon--raw
     {:class (str "w-5 h-5 flex items-center justify-center " (or class ""))}
     (when icon
       (shui/tabler-icon icon {:size (or size "16") :class ""}))]

    :checkbox
    [:div.list-item-icon.list-item-icon--checkbox
     {:class (str "w-5 h-5 flex items-center justify-center " (or class ""))}
     (shui/checkbox {:checked checked?
                     :on-checked-change on-checked-change
                     :class "w-4 h-4"})]

    ;; fallback to default
    [:div.list-item-icon.list-item-icon--default
     {:class (str "w-5 h-5 rounded flex items-center justify-center " (or class ""))}
     (when icon
       (shui/tabler-icon icon {:size (or size "14") :class ""}))]))

