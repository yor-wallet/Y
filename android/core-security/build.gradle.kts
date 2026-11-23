plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}
android { namespace = "com.omwallet.core.security" }
dependencies {
    implementation(libs.androidx.core.ktx)
    testImplementation(libs.junit)
}
