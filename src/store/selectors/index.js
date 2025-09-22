// src/store/selectors/custom.js
import { createSelector } from 'reselect';

// Base selector
const getSyncState = state => {
    return state.sync;
};

// Individual selectors
export const getSync = createSelector(
    [getSyncState],
    sync => sync.syncing
);
