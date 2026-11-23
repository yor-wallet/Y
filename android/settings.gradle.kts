pluginManagement {
    repositories { google(); mavenCentral(); gradlePluginPortal() }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    /* Google's mirror of Maven Central first (Maven Central rate-limits large downloads such as Robolectric's runtime) */
    repositories { google(); maven("https://maven-central.storage-download.googleapis.com/maven2/"); mavenCentral() }
}
rootProject.name = "OMWallet"
include(
    ":app",
    ":core-design", ":core-ui", ":core-network", ":core-data", ":core-security",
    ":feature-dashboard", ":feature-assets", ":feature-markets", ":feature-deposit",
    ":feature-withdraw", ":feature-send", ":feature-history", ":feature-admin",
)
