//
//  DowloadiCloudFiles.m
//  Logseq
//
//  Created by leizhe on 2021/12/29.
//

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(DownloadiCloudFiles, "DownloadiCloudFiles",
           CAP_PLUGIN_METHOD(downloadFilesFromiCloud, CAPPluginReturnPromise);
           )
