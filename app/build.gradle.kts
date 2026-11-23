plugins {
    id("com.android.application")
}

android {
    namespace = "com.nheil.liftlog"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.nheil.liftlog"
        minSdk = 26
        targetSdk = 34
        versionCode = 2
        versionName = "2.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
