package com.janiscommerce.appcheckupdates;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

public class ApkInstallerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public ApkInstallerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "ApkInstaller";
    }

    @ReactMethod
    public void install(String filePath, Promise promise) {
        try {
            File apkFile = new File(filePath);

            if (!apkFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found at: " + filePath);
                return;
            }

            Uri apkUri;
            Intent intent;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                String authority = reactContext.getPackageName() + ".fileprovider";

                try {
                    apkUri = FileProvider.getUriForFile(reactContext, authority, apkFile);
                } catch (IllegalArgumentException e) {
                    promise.reject("FILEPROVIDER_ERROR", "FileProvider error with authority: " + authority + ". Error: " + e.getMessage());
                    return;
                }

                intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
                intent.setData(apkUri);
                intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
                intent.putExtra(Intent.EXTRA_RETURN_RESULT, true);
                intent.putExtra(Intent.EXTRA_INSTALLER_PACKAGE_NAME, reactContext.getPackageName());
            } else {
                apkUri = Uri.fromFile(apkFile);
                intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            }

            reactContext.startActivity(intent);
            promise.resolve(true);

        } catch (Exception e) {
            promise.reject("INSTALL_ERROR", "Error installing APK: " + e.getMessage());
        }
    }
}
