package com.tvnewshub

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.util.Timer
import java.util.TimerTask

class ApkInstallerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var downloadId: Long = -1L
    private var progressTimer: Timer? = null

    override fun getName(): String = "ApkInstaller"

    @ReactMethod
    fun downloadAndInstall(url: String, fileName: String, promise: Promise) {
        try {
            val downloadManager = reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val destinationFile = File(
                reactContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                fileName
            )

            if (destinationFile.exists()) {
                destinationFile.delete()
            }

            val request = DownloadManager.Request(Uri.parse(url))
                .setTitle("Downloading TV-NewsHub Update")
                .setDescription("Downloading latest version...")
                .setDestinationUri(Uri.fromFile(destinationFile))
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            downloadId = downloadManager.enqueue(request)

            progressTimer?.cancel()
            progressTimer = Timer()
            progressTimer?.scheduleAtFixedRate(object : TimerTask() {
                override fun run() {
                    val query = DownloadManager.Query().setFilterById(downloadId)
                    val cursor = downloadManager.query(query)
                    if (cursor != null && cursor.moveToFirst()) {
                        val bytesDownloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                        val bytesTotal = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                        val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

                        if (bytesTotal > 0) {
                            val progress = ((bytesDownloaded * 100) / bytesTotal).toInt()
                            val params = Arguments.createMap().apply {
                                putInt("progress", progress)
                                putDouble("bytesDownloaded", bytesDownloaded.toDouble())
                                putDouble("bytesTotal", bytesTotal.toDouble())
                                putInt("status", status)
                            }
                            sendEvent("onDownloadProgress", params)
                        }

                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            progressTimer?.cancel()
                            cursor.close()
                            installApk(destinationFile)
                            promise.resolve("SUCCESS")
                            return
                        } else if (status == DownloadManager.STATUS_FAILED) {
                            progressTimer?.cancel()
                            cursor.close()
                            promise.reject("DOWNLOAD_FAILED", "Download failed in DownloadManager")
                            return
                        }
                        cursor.close()
                    }
                }
            }, 0, 300)

        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message, e)
        }
    }

    private fun installApk(file: File) {
        val intent = Intent(Intent.ACTION_VIEW)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val apkUri = FileProvider.getUriForFile(
                reactContext,
                "${reactContext.packageName}.provider",
                file
            )
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive")
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } else {
            intent.setDataAndType(Uri.fromFile(file), "application/vnd.android.package-archive")
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
