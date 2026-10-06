(* Native twin of src/extension/logseq_virt.ml.

   The web logseq-virt extension carries DOM contracts that have no
   native meaning (data-* locators, translateY positioning, the
   virtualizer attach). Shared view code emits [region] for the
   virtuoso-era scaffold wrappers; on native hosts it degrades to the
   same logseq-<tag> node the sites emitted before, so the LUI tree
   stays identical across backends. *)

let region ?key ?(style_class = "") ?(data_attrs = []) ?(style = "")
    (children : Lui_elements.t list) : Lui_elements.t =
  Logseq_dom.dom ?key ~style_class
    ~attrs:(data_attrs @ if style = "" then [] else [ ("style", style) ])
    children
