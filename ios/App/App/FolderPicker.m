//
//  FolderPicker.m
//  App
//
//  Created by weihua on 9/29/21.
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FolderPicker, "FolderPicker",
    CAP_PLUGIN_METHOD(pickFolder, CAPPluginReturnPromise);
)
