package com.daymark.tones

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentValues
import android.media.AudioAttributes
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DaymarkToneModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DaymarkTone")

    AsyncFunction("getApiLevel") {
      Build.VERSION.SDK_INT
    }

    AsyncFunction("registerNotificationAudio") { sourceUriValue: String, displayNameValue: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("Android context is unavailable.")
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        throw IllegalStateException("Uploaded notification sounds require Android 10 or later.")
      }

      val sourceUri = Uri.parse(sourceUriValue)
      val resolver = context.contentResolver
      val metadata = MediaMetadataRetriever()
      val durationMs = try {
        metadata.setDataSource(context, sourceUri)
        metadata.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
      } finally {
        metadata.release()
      }
      if (durationMs <= 0L) throw IllegalArgumentException("This audio file could not be read.")
      if (durationMs > 30_000L) throw IllegalArgumentException("Choose a tune that is 30 seconds or shorter.")

      val mimeType = resolver.getType(sourceUri)
        ?: when (displayNameValue.substringAfterLast('.', "").lowercase()) {
          "wav" -> "audio/wav"
          "mp3" -> "audio/mpeg"
          "m4a" -> "audio/mp4"
          "ogg" -> "audio/ogg"
          else -> "application/octet-stream"
        }
      if (!mimeType.startsWith("audio/")) throw IllegalArgumentException("Choose an audio file.")

      val cleanName = displayNameValue
        .substringAfterLast('/')
        .replace(Regex("[^A-Za-z0-9._-]"), "_")
        .take(60)
        .ifBlank { "reminder.wav" }
      val values = ContentValues().apply {
        put(MediaStore.MediaColumns.DISPLAY_NAME, "daymark_${System.currentTimeMillis()}_$cleanName")
        put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
        put(MediaStore.MediaColumns.RELATIVE_PATH, "${Environment.DIRECTORY_NOTIFICATIONS}/Daymark")
        put(MediaStore.MediaColumns.IS_PENDING, 1)
        put(MediaStore.Audio.AudioColumns.IS_NOTIFICATION, 1)
        put(MediaStore.Audio.AudioColumns.IS_MUSIC, 0)
      }
      val destinationUri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values)
        ?: throw IllegalStateException("Android could not save this notification sound.")

      try {
        val input = resolver.openInputStream(sourceUri)
          ?: throw IllegalStateException("This audio file can no longer be opened.")
        input.use { source ->
          val output = resolver.openOutputStream(destinationUri, "w")
            ?: throw IllegalStateException("Android could not save this notification sound.")
          output.use { target -> source.copyTo(target) }
        }
        val published = ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) }
        resolver.update(destinationUri, published, null, null)
        destinationUri.toString()
      } catch (error: Exception) {
        resolver.delete(destinationUri, null, null)
        throw error
      }
    }

    AsyncFunction("createToneNotificationChannel") { channelId: String, channelName: String, soundUriValue: String ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@AsyncFunction
      if (!channelId.startsWith("daymark-tone-")) throw IllegalArgumentException("Invalid Daymark tone channel.")
      val context = appContext.reactContext
        ?: throw IllegalStateException("Android context is unavailable.")
      val manager = context.getSystemService(NotificationManager::class.java)
        ?: throw IllegalStateException("Notification channels are unavailable.")
      if (manager.getNotificationChannel(channelId) == null) {
        val soundUri = Uri.parse(soundUriValue)
        val audioAttributes = AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_NOTIFICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        val channel = NotificationChannel(channelId, channelName.take(40), NotificationManager.IMPORTANCE_DEFAULT).apply {
          description = "Local reminders for your Daymark habits"
          enableVibration(true)
          setSound(soundUri, audioAttributes)
        }
        manager.createNotificationChannel(channel)
      }
    }

    AsyncFunction("deleteNotificationAudio") { soundUriValue: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("Android context is unavailable.")
      val uri = Uri.parse(soundUriValue)
      if (uri.scheme != "content" || uri.authority != MediaStore.AUTHORITY) {
        throw IllegalArgumentException("Only Daymark notification audio can be removed.")
      }
      val resolver = context.contentResolver
      val projection = arrayOf(MediaStore.MediaColumns.DISPLAY_NAME, MediaStore.MediaColumns.RELATIVE_PATH)
      val ownedByDaymark = resolver.query(uri, projection, null, null, null)?.use { cursor ->
        if (!cursor.moveToFirst()) false else {
          val name = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME))
          val path = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.RELATIVE_PATH))?.trimEnd('/')
          name.startsWith("daymark_") && path == "${Environment.DIRECTORY_NOTIFICATIONS}/Daymark"
        }
      } ?: false
      if (!ownedByDaymark) throw IllegalArgumentException("Only Daymark notification audio can be removed.")
      resolver.delete(uri, null, null)
    }

    AsyncFunction("deleteToneNotificationChannel") { channelId: String ->
      if (!channelId.startsWith("daymark-tone-")) return@AsyncFunction
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val context = appContext.reactContext
          ?: throw IllegalStateException("Android context is unavailable.")
        context.getSystemService(NotificationManager::class.java)?.deleteNotificationChannel(channelId)
      }
    }
  }
}
