// import { Message } from "element-ui";

export const formatSize = function(value, scale) {
  if (value == null || value == "") {
    return "0 Bytes";
  }
  var unitArr = new Array(
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB",
    "EB",
    "ZB",
    "YB"
  );
  var index = 0;
  index = Math.floor(Math.log(value) / Math.log(1024));
  var size = value / Math.pow(1024, index);
  size = size.toFixed(scale || 2);
  return size + " " + unitArr[index];
};

export const LimitResquest = function(limit, process) {
  let currentSum = 0;
  let requests = [];

  async function run() {
    let err, result;
    try {
      ++currentSum;
      handler.leftCount = requests.length;
      const fn = requests.shift();
      result = await fn();
    } catch (error) {
      err = error;
      // console.log("Error", err);
      handler.errorCount++;
    } finally {
      --currentSum;
      handler.requestCount++;
      handler.leftCount = requests.length;
      process && process(handler, result, err);
      if (requests.length > 0) {
        run();
      }
    }
  }

  const handler = reqFn => {
    if (!reqFn || !(reqFn instanceof Function)) {
      return;
    }
    requests.push(reqFn);
    handler.leftCount = requests.length;
    if (currentSum < limit) {
      run();
    }
  };

  handler.requestCount = 0;
  handler.leftCount = 0;
  handler.errorCount = 0;
  handler.cancel = () => {
    requests = [];
  };
  handler.isEnd = () => {
    return !handler.leftCount && !currentSum;
  };

  return handler;
};

export const networkFirstRequest = async function(
  requestFunc,
  cacheKey,
  forceCache
) {
  cacheKey = "localCache@" + cacheKey;
  const useCache = forceCache || !window.serviceWorkerReady;

  // helper: read cache from $cacheStorage, fallback to localStorage
  const readCache = () =>
    window.$cacheStorage
      .getItem(cacheKey)
      .then(cacheResponse => {
        if (cacheResponse) return cacheResponse;
        throw new Error("cache miss");
      })
      .catch(() => {
        try {
          let cacheResponse =
            window.localStorage && window.localStorage.getItem(cacheKey);
          if (cacheResponse) {
            cacheResponse = JSON.parse(cacheResponse);
            if (cacheResponse) return cacheResponse;
          }
        } catch (error) {
          //
        }
        return null;
      });

  // helper: write cache
  const writeCache = data => {
    try {
      window.$cacheStorage.setItem(cacheKey, data).catch(() => {});
    } catch (e) {
      //
    }
  };

  if (useCache) {
    // stale-while-revalidate: return cache first, then fetch in background
    const cached = await readCache();
    if (cached) {
      // fire background request to update cache, don't block caller
      requestFunc()
        .then(res => {
          if (res && res.data && res.data.isSuccess) {
            writeCache(res.data);
          }
        })
        .catch(() => {});
      return { data: cached };
    }
    // no cache, must wait for network
    const res = await requestFunc().catch(err => {
      throw err;
    });
    if (res && res.data && res.data.isSuccess) {
      writeCache(res.data);
    }
    return res;
  }

  // original network-first logic (serviceWorker active)
  const res = await requestFunc().catch(err => {
    throw err;
  });
  if (res && res.data && res.data.isSuccess) {
    writeCache(res.data);
  }
  return res;
};

export const cacheFirstRequest = async function(
  requestFunc,
  cacheKey,
  validateCache,
  forceCache
) {
  cacheKey = "localCache@" + cacheKey;
  // validateCache === true 时，直接刷新缓存
  if (validateCache !== true) {
    if (forceCache || !window.serviceWorkerReady) {
      let cacheResponse = await window.$cacheStorage
        .getItem(cacheKey)
        .then(cacheResponse => {
          if (cacheResponse) {
            return cacheResponse;
          }
          // console.log("Cache not found in new cache");
          throw new Error("Cache not found");
        })
        .catch(() => {
          // 兼容旧逻辑
          try {
            let cacheResponse =
              window.localStorage && window.localStorage.getItem(cacheKey);
            if (cacheResponse) {
              cacheResponse = JSON.parse(cacheResponse);
              if (cacheResponse) {
                return cacheResponse;
              }
            }
          } catch (error) {
            //
          }
          return null;
        });
      if (cacheResponse) {
        if (!validateCache || (validateCache && validateCache(cacheResponse))) {
          return { data: cacheResponse };
        }
      }
    }
  }
  const res = await requestFunc();
  if (
    (forceCache || !window.serviceWorkerReady) &&
    res.data &&
    res.data.isSuccess
  ) {
    // 使用新的异步存储
    window.$cacheStorage.setItem(cacheKey, res.data).catch(() => {});
  }
  return res;
};

export const isMiniInterface = () => window.innerWidth <= 750;
