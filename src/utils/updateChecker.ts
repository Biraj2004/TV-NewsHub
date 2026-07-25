export interface UpdateResult {
  hasUpdate: boolean;
  newVersion: string;
  size: string;
  downloadUrl: string;
}

export async function checkForAppUpdates(currentVersion: string): Promise<UpdateResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.github.com/repos/Biraj2004/TV-NewsHub/releases/latest', {
      headers: { Accept: 'application/vnd.github.v3+json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    const rawTag = data.tag_name ? data.tag_name.trim() : '';
    const tagClean = rawTag.replace(/^v/, '');
    const currentClean = currentVersion.replace(/^v/, '');

    if (isNewerVersion(tagClean, currentClean)) {
      let sizeStr = '70.7 MB';
      if (data.assets && Array.isArray(data.assets) && data.assets.length > 0) {
        const universalAsset = data.assets.find((a: any) => a.name && a.name.toLowerCase().includes('universal'));
        const targetAsset = universalAsset || data.assets[0];
        if (targetAsset && targetAsset.size) {
          const sizeMb = (targetAsset.size / (1024 * 1024)).toFixed(1);
          sizeStr = `${sizeMb} MB`;
        }
      }

      return {
        hasUpdate: true,
        newVersion: rawTag.startsWith('v') ? rawTag : `v${rawTag}`,
        size: sizeStr,
        downloadUrl: data.html_url || 'https://github.com/Biraj2004/TV-NewsHub/releases/latest',
      };
    }

    return null;
  } catch (err) {
    if (__DEV__) {
      console.log('[UpdateChecker] Silent skip on check error:', err);
    }
    return null;
  }
}

function isNewerVersion(latest: string, current: string): boolean {
  if (!latest || !current) return false;
  const lParts = latest.split('.').map((p) => parseInt(p, 10) || 0);
  const cParts = current.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}
