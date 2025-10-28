package com.janiscommerce.appcheckupdates;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import java.io.File;

public class InstallReceiver extends BroadcastReceiver {

    private static final String TAG = "InstallReceiver";
    private static final String PREFS_NAME = "AppCheckUpdatesPrefs";
    private static final String KEY_UPDATE_PENDING = "updatePending";
    private static final String KEY_APK_PATH = "apkPath";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        // Este intent se dispara cuando la app se reemplaza (actualiza)
        if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            Log.d(TAG, "App has been updated, cleaning up old APK files");

            try {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                boolean updatePending = prefs.getBoolean(KEY_UPDATE_PENDING, false);

                if (updatePending) {
                    String apkPath = prefs.getString(KEY_APK_PATH, null);

                    // Limpiar las preferencias
                    SharedPreferences.Editor editor = prefs.edit();
                    editor.remove(KEY_UPDATE_PENDING);
                    editor.remove(KEY_APK_PATH);
                    editor.apply();

                    // Eliminar el archivo APK si existe
                    if (apkPath != null) {
                        try {
                            File oldApk = new File(apkPath);
                            if (oldApk.exists()) {
                                boolean deleted = oldApk.delete();
                                Log.d(TAG, "APK file deleted: " + deleted);
                            }

                            // Intentar eliminar el directorio padre si está vacío
                            File parentDir = oldApk.getParentFile();
                            if (parentDir != null && parentDir.exists()) {
                                String[] files = parentDir.list();
                                if (files == null || files.length == 0) {
                                    boolean dirDeleted = parentDir.delete();
                                    Log.d(TAG, "Parent directory deleted: " + dirDeleted);
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error deleting old APK files", e);
                        }
                    }

                    Log.d(TAG, "Cleanup completed successfully");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in InstallReceiver", e);
            }
        }
    }
}
