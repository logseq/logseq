(() => {
  const base = document.currentScript.src;
  let loading;
  window.loadLogseqPDF = () => {
    if (!loading) {
      loading = import(new URL('./pdfjs/pdf.mjs', base).href)
        .then(() => import(new URL('./pdf_viewer3.mjs', base).href));
    }
    return loading;
  };
})();
