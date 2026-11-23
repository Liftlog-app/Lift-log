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
        versionCode = 6
        versionName = "2.3"
    }

    // One fixed key so every new build installs over the old one (keeps your data).
    signingConfigs {
        create("liftlog") {
            storeFile = file("liftlog.keystore")
            storePassword = "liftlog123"
            keyAlias = "liftlog"
            keyPassword = "liftlog123"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("liftlog")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("liftlog")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
