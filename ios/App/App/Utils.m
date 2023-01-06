//
//  Utils.m
//  Logseq
//
//  Created by leizhe on 2022/5/23.
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(Utils, "Utils",
    CAP_PLUGIN_METHOD(isZoomed, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getDocumentRoot, CAPPluginReturnPromise);
)
