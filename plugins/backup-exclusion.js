const { withAppDelegate, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to exclude app-specific directories from OS cloud backups.
 * iOS: Sets NSURLIsExcludedFromBackupKey on photos and SQLite directories.
 * Android: Ensures allowBackup="false" in AndroidManifest.xml.
 */
function withBackupExclusion(config) {
  // iOS: Exclude photos and database directories from iCloud backup
  config = withAppDelegate(config, (config) => {
    const { modResults } = config;
    const { contents } = modResults;

    const backupExclusionCode = `
  // Exclude app data directories from iCloud backup
  NSArray *pathsToExclude = @[
    [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject],
    [[NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) firstObject] stringByAppendingPathComponent:@"Application Support"]
  ];
  for (NSString *path in pathsToExclude) {
    NSURL *url = [NSURL fileURLWithPath:path];
    [url setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:nil];
  }
`;

    // Insert after `[super application:application didFinishLaunchingWithOptions:launchOptions];`
    const marker = '[super application:application didFinishLaunchingWithOptions:launchOptions];';
    if (contents.includes(marker) && !contents.includes('NSURLIsExcludedFromBackupKey')) {
      modResults.contents = contents.replace(
        marker,
        marker + backupExclusionCode
      );
    }

    return config;
  });

  // Android: Ensure allowBackup is false
  config = withAndroidManifest(config, (config) => {
    const { modResults } = config;
    const { manifest } = modResults;

    if (manifest && manifest.application && manifest.application[0]) {
      manifest.application[0].$['android:allowBackup'] = 'false';
    }

    return config;
  });

  return config;
}

module.exports = withBackupExclusion;
