//
//  FileContainer.m
//  App
//
//  Created by weihua on 9/29/21.
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FileContainer, "FileContainer",
    CAP_PLUGIN_METHOD(ensureDocuments, CAPPluginReturnPromise);
)
