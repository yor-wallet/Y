plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
}
android {
    namespace = "com.omwallet.core.network"
    buildFeatures { buildConfig = true }
    defaultConfig {
        /* Public project URL and anon key (protected by row-level security and server-side checks) — the same as the web app. */
        buildConfigField("String", "SUPABASE_URL", "\"https://gebjmguoauvutiqvoswl.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${rootProject.file("../js/core/supabase-client.js").readText().substringAfter("SUPABASE_ANON_KEY = \"").substringBefore("\"")}\"")
    }
}
dependencies {
    api(libs.okhttp)
    api(libs.kotlinx.serialization.json)
    api(libs.kotlinx.coroutines.android)
    testImplementation(libs.junit)
    testImplementation(libs.okhttp.mockwebserver)
    testImplementation(libs.kotlinx.coroutines.test)
}
