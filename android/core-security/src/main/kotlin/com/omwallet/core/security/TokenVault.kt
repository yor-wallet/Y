package com.omwallet.core.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/* The session refresh token is encrypted with an AES-256-GCM key that never leaves the Android Keystore.
   Only the ciphertext is stored (app-private preferences). Never a seed, a private key or a PIN: OM Wallet does not hold any. */
interface SecretStore {
    fun put(name: String, value: String?)
    fun get(name: String): String?
}

class KeystoreSecretStore(context: Context) : SecretStore {
    private val prefs = context.getSharedPreferences("om_secure", Context.MODE_PRIVATE)
    private val alias = "om_wallet_session_key"

    private fun key(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getEntry(alias, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }
        val gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        gen.init(
            KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        )
        return gen.generateKey()
    }

    private fun encrypt(value: String): String {
        val c = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
        return Base64.encodeToString(c.iv + c.doFinal(value.toByteArray(Charsets.UTF_8)), Base64.NO_WRAP)
    }

    /* A key the system invalidated (lock-screen reset, some OEM Keystore failures) must never block signing in: the dead key is removed,
       a new one is created, and if even that fails the session is simply not remembered (the person signs in again next time). */
    override fun put(name: String, value: String?) {
        if (value == null) { prefs.edit().remove(name).apply(); return }
        val stored = runCatching { encrypt(value) }.getOrElse {
            runCatching { KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.deleteEntry(alias) }
            runCatching { encrypt(value) }.getOrNull()
        }
        if (stored != null) prefs.edit().putString(name, stored).apply() else prefs.edit().remove(name).apply()
    }

    override fun get(name: String): String? = runCatching {
        val raw = Base64.decode(prefs.getString(name, null) ?: return null, Base64.NO_WRAP)
        val c = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, raw, 0, 12)) }
        String(c.doFinal(raw, 12, raw.size - 12), Charsets.UTF_8)
    }.getOrNull()   /* a key invalidated by the system (e.g. lock-screen change) simply means: sign in again */
}

/* For tests and for devices without a usable Keystore: memory only, nothing written. */
class MemorySecretStore : SecretStore {
    private val m = mutableMapOf<String, String>()
    override fun put(name: String, value: String?) { if (value == null) m.remove(name) else m[name] = value }
    override fun get(name: String): String? = m[name]
}
