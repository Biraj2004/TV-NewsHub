import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { UpdateResult } from '../utils/updateChecker';

interface UpdateBannerProps {
  updateInfo: UpdateResult;
  onDismiss: () => void;
}

export function UpdateBanner({ updateInfo, onDismiss }: UpdateBannerProps) {
  const [downloadFocused, setDownloadFocused] = useState(false);
  const [cancelFocused, setCancelFocused] = useState(false);

  const handleDownload = () => {
    if (updateInfo.downloadUrl) {
      Linking.openURL(updateInfo.downloadUrl).catch((err) => {
        if (__DEV__) console.warn('[UpdateBanner] Failed to open download URL:', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoSection}>
        <Text style={styles.iconText}>🚀</Text>
        <View style={styles.textColumn}>
          <Text style={styles.titleText}>
            New Version Available: <Text style={styles.versionHighlight}>{updateInfo.newVersion}</Text>
          </Text>
          <Text style={styles.subText}>
            Size: {updateInfo.size} &nbsp;·&nbsp; Download the latest TV-NewsHub release
          </Text>
        </View>
      </View>

      <View style={styles.buttonsRow}>
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

        <Pressable
          onFocus={() => setCancelFocused(true)}
          onBlur={() => setCancelFocused(false)}
          onPress={onDismiss}
          style={[styles.btn, styles.cancelBtn, cancelFocused && styles.btnFocused]}
        >
          <Text style={[styles.btnText, styles.cancelBtnText, cancelFocused && styles.btnTextFocused]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 24,
    marginRight: 14,
  },
  textColumn: {
    justifyContent: 'center',
  },
  titleText: {
    color: '#ffffff',
    fontSize: 15,
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
});
