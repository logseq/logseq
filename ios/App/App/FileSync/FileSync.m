//
//  FileSync.m
//  Logseq
//
//  Created by Mono Wang on 2/24/R4.
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FileSync, "FileSync",
           CAP_PLUGIN_METHOD(setEnv, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(keygen, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getLocalFilesMeta, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getLocalAllFilesMeta, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(renameLocalFile, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(deleteLocalFiles, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(updateLocalFiles, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(deleteRemoteFiles, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(updateRemoteFiles, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(encryptFnames, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(decryptFnames, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(updateLocalVersionFiles, CAPPluginReturnPromise);
)
