plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}
/* Shared presentation layer: strings (en / fr / ar), status wording, transaction rows and sheets, view-model factory. */
android { namespace = "com.omwallet.core.ui" }
dependencies {
    api(project(":core-design"))
    api(project(":core-data"))
    api(libs.androidx.lifecycle.viewmodel)
    api(libs.androidx.lifecycle.runtime)
    api(libs.androidx.activity.compose)
    testImplementation(libs.junit)
}
