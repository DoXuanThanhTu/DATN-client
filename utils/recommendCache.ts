const KEY = "recommend_cache";
const TTL = 5 * 60 * 1000; // 5 phút

export function getRecommendCache() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const cache = JSON.parse(raw);

    if (Date.now() > cache.expireAt) {
      localStorage.removeItem(KEY);
      return null;
    }

    return cache.data;
  } catch {
    return null;
  }
}

export function setRecommendCache(data: any) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      data,
      expireAt: Date.now() + TTL,
    })
  );
}