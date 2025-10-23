package com.janiscommerce.appcheckupdates;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
    private static final String PREFS_NAME = "AppCheckUpdatesPrefs";
    private static final String KEY_UPDATE_PENDING = "updatePending";
    private static final String KEY_APK_PATH = "apkPath";

    public ApkInstallerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "ApkInstaller";
    }

    private SharedPreferences getPreferences() {
        return reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    @ReactMethod
    public void install(String filePath, Promise promise) {
        try {
            File apkFile = new File(filePath);

            if (!apkFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found at: " + filePath);
                return;
            }

            // Guardar flag indicando que hay una actualización pendiente
            SharedPreferences.Editor editor = getPreferences().edit();
            editor.putBoolean(KEY_UPDATE_PENDING, true);
            editor.putString(KEY_APK_PATH, filePath);
            editor.apply();

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

    @ReactMethod
    public void checkUpdateCompleted(Promise promise) {
        try {
            SharedPreferences prefs = getPreferences();
            boolean updatePending = prefs.getBoolean(KEY_UPDATE_PENDING, false);

            if (updatePending) {
                // La actualización se completó, limpiar la flag
                String apkPath = prefs.getString(KEY_APK_PATH, null);

                SharedPreferences.Editor editor = prefs.edit();
                editor.remove(KEY_UPDATE_PENDING);
                editor.remove(KEY_APK_PATH);
                editor.apply();

                // Intentar eliminar la APK vieja si existe
                if (apkPath != null) {
                    try {
                        File oldApk = new File(apkPath);
                        if (oldApk.exists()) {
                            oldApk.delete();
                        }
                        // Intentar eliminar el directorio padre si está vacío
                        File parentDir = oldApk.getParentFile();
                        if (parentDir != null && parentDir.exists()) {
                            String[] files = parentDir.list();
                            if (files == null || files.length == 0) {
                                parentDir.delete();
                            }
                        }
                    } catch (Exception e) {
                        // Ignorar errores al eliminar archivos
                    }
                }

                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("CHECK_ERROR", "Error checking update status: " + e.getMessage());
        }
    }
}
