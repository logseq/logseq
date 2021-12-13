// workaround from https://github.com/electron/electron/issues/426#issuecomment-658901422
// We set an intercept on incoming requests to disable x-frame-options
// headers.

export const disableXFrameOptions = (win) => {
  win.webContents.session.webRequest.onHeadersReceived({ urls: [ "*://*/*" ] },
                                                       (d, c)=>{
                                                         if(d.responseHeaders['X-Frame-Options']){
                                                           delete d.responseHeaders['X-Frame-Options'];
                                                         } else if(d.responseHeaders['x-frame-options']) {
                                                           delete d.responseHeaders['x-frame-options'];
                                                         }

                                                         c({cancel: false, responseHeaders: d.responseHeaders});
                                                       }
                                                      );

};
