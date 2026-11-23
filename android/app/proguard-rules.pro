# OM Wallet release rules. Libraries (OkHttp, kotlinx.serialization, Room, WorkManager, ZXing) ship their own consumer rules.
# Keep the serializer of the persisted session (read back after an update).
-keep,includedescriptorclasses class com.omwallet.core.network.Session$$serializer { *; }
-keepclassmembers class com.omwallet.core.network.Session { *** Companion; }
# Crash reports stay readable without shipping source names.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
