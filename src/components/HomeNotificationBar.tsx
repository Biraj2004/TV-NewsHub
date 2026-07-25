import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  NativeModules,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import { UpdateResult } from '../utils/updateChecker';

interface HomeNotificationBarProps {
  updateInfo: UpdateResult | null;
  isUpdateDismissed: boolean;
  onDismissUpdate: () => void;
  isLiveStatusDegraded?: boolean;
}

export function HomeNotificationBar({
  updateInfo,
  isUpdateDismissed,
  onDismissUpdate,
  isLiveStatusDegraded,
}: HomeNotificationBarProps) {
  const [downloadFocused, setDownloadFocused] = useState(false);
  const [cancelFocused, setCancelFocused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedBytesStr, setDownloadedBytesStr] = useState('0 MB');

  useEffect(() => {
    let sub: any;
    if (Platform.OS === 'android') {
      sub = DeviceEventEmitter.addListener('onDownloadProgress', (data: any) => {
        if (data && typeof data.progress === 'number') {
          setDownloadProgress(data.progress);
          if (data.bytesDownloaded) {
            const mb = (data.bytesDownloaded / (1024 * 1024)).toFixed(1);
            setDownloadedBytesStr(`${mb} MB`);
          }
        }
      });
    }
    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  // Priority 1: Actionable App Update Available
  if (updateInfo && !isUpdateDismissed) {
    const handleDownload = async () => {
      if (isDownloading) return;

      setIsDownloading(true);
      setDownloadProgress(0);

      let apkUrl = updateInfo.downloadUrl;
      if (apkUrl.includes('/releases/tag/')) {
        const ver = updateInfo.newVersion.startsWith('v') ? updateInfo.newVersion : `v${updateInfo.newVersion}`;
        apkUrl = `https://github.com/Biraj2004/TV-NewsHub/releases/download/${ver}/TV-NewsHub-${ver}-universal.apk`;
      }

      if (Platform.OS === 'android' && NativeModules.ApkInstaller) {
        try {
          const fileName = `TV-NewsHub-${updateInfo.newVersion}.apk`;
          await NativeModules.ApkInstaller.downloadAndInstall(apkUrl, fileName);
        } catch (err) {
          if (__DEV__) console.warn('[HomeNotificationBar] In-app installer error:', err);
          Linking.openURL(updateInfo.downloadUrl).catch(() => {});
          setIsDownloading(false);
        }
      } else {
        Linking.openURL(updateInfo.downloadUrl).catch(() => {});
        setIsDownloading(false);
      }
    };

    return (
      <View style={styles.updateContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.iconText}>🚀</Text>
          <View style={styles.textColumn}>
            <Text style={styles.titleText}>
              Update Available: <Text style={styles.versionHighlight}>{updateInfo.newVersion}</Text>
            </Text>
            {isDownloading ? (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabelText}>
                  {downloadProgress >= 100
                    ? 'Launching installer prompt...'
                    : `Downloading update: ${downloadProgress}% · ${downloadedBytesStr} / ${updateInfo.size}`}
                </Text>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
                </View>
              </View>
            ) : (
              <Text style={styles.subText}>
                Size: {updateInfo.size} &nbsp;·&nbsp; Download & Install directly in-app
              </Text>
            )}
          </View>
        </View>

        <View style={styles.buttonsRow}>
          {!isDownloading && (
            <Pressable
              hasTVPreferredFocus={true}
              onFocus={() => setDownloadFocused(true)}
              onBlur={() => setDownloadFocused(false)}
              onPress={handleDownload}
              style={[styles.btn, styles.downloadBtn, downloadFocused && styles.btnFocused]}
            >
              <Text style={[styles.btnText, styles.downloadBtnText, downloadFocused && styles.btnTextFocused]}>
                Download
              </Text>
            </Pressable>
          )}

          <Pressable
            onFocus={() => setCancelFocused(true)}
            onBlur={() => setCancelFocused(false)}
            onPress={onDismissUpdate}
            style={[styles.btn, styles.cancelBtn, cancelFocused && styles.btnFocused]}
          >
            <Text style={[styles.btnText, styles.cancelBtnText, cancelFocused && styles.btnTextFocused]}>
              {isDownloading ? 'Dismiss' : 'Cancel'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Priority 2: Fallback Subtle Live Status Pill
  if (isLiveStatusDegraded) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusIcon}>📡</Text>
        <Text style={styles.statusText}>
          Live status check unavailable — showing cached channel feeds
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  updateContainer: {
    backgroundColor: '#121217',
    borderWidth: 1.5,
    borderColor: '#272738',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 32,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconText: {
    fontSize: 22,
    marginRight: 14,
  },
  textColumn: {
    justifyContent: 'center',
    flex: 1,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  versionHighlight: {
    color: '#10b981',
    fontWeight: '800',
  },
  subText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  progressSection: {
    marginTop: 4,
    width: '100%',
    maxWidth: 360,
  },
  progressLabelText: {
    color: '#10b981',
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadBtn: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  btnFocused: {
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    transform: [{ scale: 1.05 }],
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtnText: {
    color: '#09090b',
  },
  cancelBtnText: {
    color: '#f4f4f5',
  },
  btnTextFocused: {
    color: '#09090b',
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 32,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
});
