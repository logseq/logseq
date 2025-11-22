package com.logseq.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import java.util.concurrent.TimeUnit

class MobileSyncService : Service() {
    companion object {
        private const val TAG = "MobileSyncService"
        private const val ACTION_TRIGGER_SYNC = "com.logseq.app.action.TRIGGER_SYNC"
        private const val BACKGROUND_INTERVAL = 15L // minutes

        private var bridgeHolder: MobileSyncBridgeHolder? = null

        fun registerBridge(holder: MobileSyncBridgeHolder) {
            bridgeHolder = holder
        }

        fun schedule(context: Context) {
            val intent = Intent(context, MobileSyncService::class.java).apply {
                action = ACTION_TRIGGER_SYNC
            }
            val pendingIntent = PendingIntent.getService(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val triggerAt = SystemClock.elapsedRealtime() + TimeUnit.MINUTES.toMillis(BACKGROUND_INTERVAL)
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent)
            Log.d(TAG, "Scheduled background sync in $BACKGROUND_INTERVAL minutes")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_TRIGGER_SYNC) {
            triggerSync()
            schedule(applicationContext)
        }
        stopSelf(startId)
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun triggerSync() {
        val bridge = bridgeHolder?.bridge
        if (bridge == null) {
            Log.w(TAG, "Bridge not ready; cannot trigger background sync")
            return
        }
        bridge.webView?.post {
            bridge.webView?.evaluateJavascript(
                "window.logseqMobile && window.logseqMobile.backgroundSync && window.logseqMobile.backgroundSync.trigger && window.logseqMobile.backgroundSync.trigger()"
            ) { result ->
                Log.d(TAG, "Background sync JS result: $result")
            }
        }
    }

    interface MobileSyncBridgeHolder {
        val bridge: com.getcapacitor.Bridge?
    }
}
