Documentation for Magento PWA Studio packages is located at [https://developer.adobe.com/commerce/pwa-studio/](https://developer.adobe.com/commerce/pwa-studio/).

# Magento 2 PWA Venia – Offline Cart Queue & Sync Indicator

This customization extends **Magento PWA Studio Venia UI** with offline cart support and online/offline syncing state indicators.  

---

## ✨ Features
- **Queue Add to Cart when offline**  
  Cart mutations made offline are queued and retried automatically once the user is online again.
- **Sync state indicator on CartTrigger**  
  A small online/offline/syncing UI indicator is shown near the cart trigger.
- **Queued mutations processing**  
  On reconnect, queued mutations are sent to Magento backend.
- **Toast notifications**  
  Success and error messages are displayed for queued mutations.

---

## 🔧 Implementation Overview

### 1. **Intercept customization**
File: `local-intercept.js`  
- Extends Venia’s `CartTrigger` component.  
- Imports `OnlineIndicator` and `useAppContext` (to track online/offline state).  
- Injects sync state UI before the cart icon.  

---

### 2. **Online/Sync Indicator**
File: `src/components/Header/onlineIndicator.js`  
- Displays current connectivity and syncing state using `react-feather` icons:  
  - ✅ Online (`Wifi`)  
  - ❌ Offline (`WifiOff`)  
  - 🔄 Syncing (`Loader`)  
- Uses `useSyncState` talon for redux-driven syncing state.

---

### 3. **Sync State Management**
**Reducer**: `src/store/reducers/index.js`  
- Manages a simple `syncing: boolean` state.  
- Action: `TOGGLE_SYNCING`.  

**Selector**: `src/store/selectors/index.js`  
- Provides `getSync` selector for accessing `syncing` flag.  

**Talon**: `src/talons/useSync.js`  
- Hook to read `syncing` and toggle it.  
- Wraps redux state with a convenient API for components.  

---

### 4. **Store Setup**
File: `src/index.js`  
- Registers service worker (`registerSW`).  
- Listens for `online` and `offline` browser events → updates Peregrine app context (`setOnline`, `setOffline`).  
- Injects `OfflineCartQueueLink` into Apollo link chain for queued mutation handling.  

---

### 5. **Offline Mutation Queue**
File: `src/lib/OfflineCartQueueLink.js`  
- Apollo link implementation for offline cart mutations.  
- Caches cart operations while offline.  
- Flushes queue automatically when network is restored.  
- Integrates with sync state & toast notifications.

---

## 📂 File Structure (custom additions)

```
src/
 ├── components/
 │    └── Header/
 │         ├── onlineIndicator.js
 │         └── onlineIndicator.module.css
 ├── lib/
 │    └── OfflineCartQueueLink.js
 ├── store/
 │    ├── reducers/index.js
 │    └── selectors/index.js
 ├── talons/
 │    └── useSync.js
 ├── index.js
 └── local-intercept.js
```

---

## 🚀 Usage
1. Go offline → add product to cart.  
2. Mutation is stored locally.  
3. When connection is restored:
   - Sync starts (`Loader` icon shown).  
   - Mutations are retried.  
   - Toasts indicate success/error.  
   - Sync state resets once done.  

---

## 🛠️ Stack
- **Magento PWA Studio (Venia UI + Peregrine)**  
- **Redux** (custom reducer for sync state)  
- **Apollo Link** (offline mutation queue)  
- **React-Feather** (status icons)  
