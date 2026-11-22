plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

/* Release signing: provided by the environment (never committed). Without it, the release bundle is built UNSIGNED. */
val keystorePath: String? = System.getenv("OM_KEYSTORE")

android {
    namespace = "com.omwallet.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.omwallet.android"
        minSdk = 26
        targetSdk = 35
        versionCode = 140200
        versionName = "14.2.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    signingConfigs {
        if (keystorePath != null) create("release") {
            storeFile = file(keystorePath)
            storePassword = System.getenv("OM_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("OM_KEY_ALIAS")
            keyPassword = System.getenv("OM_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (keystorePath != null) signingConfig = signingConfigs.getByName("release")
        }
        debug { applicationIdSuffix = ".debug"; versionNameSuffix = "-debug" }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { compose = true; buildConfig = true }
    androidResources { localeFilters += listOf("en", "fr", "ar") }       /* only the app's three languages are packaged */
    testOptions { unitTests.isIncludeAndroidResources = true }
    packaging { resources.excludes += setOf("/META-INF/{AL2.0,LGPL2.1}", "/META-INF/versions/9/previous-compilation-data.bin") }
}

dependencies {
    implementation(project(":core-ui"))
    implementation(project(":feature-dashboard"))
    implementation(project(":feature-assets"))
    implementation(project(":feature-markets"))
    implementation(project(":feature-deposit"))
    implementation(project(":feature-withdraw"))
    implementation(project(":feature-send"))
    implementation(project(":feature-history"))
    implementation(project(":feature-admin"))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.splashscreen)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.metrics)
    implementation(libs.androidx.profileinstaller)
    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.okhttp.mockwebserver)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    debugImplementation(libs.compose.ui.test.manifest)
}
