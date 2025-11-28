(ns frontend.components.combobox
  "Unified combobox component with variants for searchable dropdowns.
   Built on top of ui/auto-complete, supports both with and without visible search input.
   
   When show-search-input? is false: Simple wrapper around auto-complete (like command dropdown)
   When show-search-input? is true: Includes search input UI + separator (like select component)"
  (:require [clojure.string :as string]
            [frontend.components.combobox.item-renderer :as item-renderer]
            [frontend.ui :as ui]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc combobox
  "Unified combobox component with two variants:
   - With visible search input + separator (show-search-input? true)
   - Without visible search input/separator (show-search-input? false)
   
   Built on top of ui/auto-complete for consistent behavior.
   Uses ui__combobox as base class, and cp__select-main for backward compatibility
   when show-search-input? is true.
   
   When show-search-input? is false: Simple wrapper around auto-complete (like command dropdown)
   When show-search-input? is true: Adds separator and wraps results in item-results-wrap container
   
   Note: The search input itself should be provided by the parent component (like select does).
   
   New unified item renderer:
   - :item-renderer-config - Config object for unified item renderer (see item-renderer/render-item)
   - :item-render - Custom render function (backward compatibility, takes precedence over item-renderer-config)
   - :width - Container width: :default, :wide, :auto, or custom class string
   - :container-class - Additional classes for container"
  [items
   {:keys [show-search-input?
           show-separator?
           on-chosen
           on-shift-chosen
           get-group-name
           empty-placeholder
           item-render
           item-renderer-config
           class
           header
           grouped?
           width
           container-class]
    ;; All other auto-complete options pass through via `opts`
    :as opts}]
  (let [base-class "ui__combobox"
        width-class (case width
                     :wide "w-96"
                     :auto "w-auto"
                     (string? width) width
                     nil)
        combined-class (cond-> base-class
                         show-search-input? (str " cp__select-main")
                         width-class (str " " width-class)
                         container-class (str " " container-class)
                         class (str " " class))
        ;; Use unified item renderer if config provided and no custom item-render
        final-item-render (or item-render
                             (when item-renderer-config
                               (fn [item chosen?]
                                 (item-renderer/render-item item chosen? item-renderer-config))))
        ;; Remove keys we've destructured from opts to avoid conflicts
        opts' (dissoc opts :show-search-input? :show-separator? :on-chosen :on-shift-chosen
                      :get-group-name :empty-placeholder :item-render :item-renderer-config
                      :class :header :grouped? :width :container-class)]
    (if show-search-input?
      ;; With search input: wrap results in item-results-wrap container and optionally add separator
      [:div {:class combined-class}
       (when (not= show-separator? false)
         (shui/select-separator))
       [:div.item-results-wrap
        (ui/auto-complete
         items
         (merge {:on-chosen on-chosen
                 :on-shift-chosen on-shift-chosen
                 :get-group-name get-group-name
                 :empty-placeholder empty-placeholder
                 :item-render final-item-render
                 :header header
                 :grouped? grouped?
                 :class "cp__select-results"}
                opts'))]]
      ;; Without search input: simple wrapper around auto-complete
      ;; Ensure ui__combobox class is always applied, then add custom class if provided
      (let [final-class (if class
                          (str base-class " " class)
                          base-class)]
        (ui/auto-complete
         items
         (merge {:on-chosen on-chosen
                 :on-shift-chosen on-shift-chosen
                 :get-group-name get-group-name
                 :empty-placeholder empty-placeholder
                 :item-render final-item-render
                 :header header
                 :grouped? grouped?
                 :class final-class}
                opts'))))))

