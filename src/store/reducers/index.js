import { createActions, handleActions } from 'redux-actions';

const initialState = {
    syncing: false,
}

const prefix = 'SYNC';
const actionTypes = [
    'TOGGLE_SYNCING'
];

export const actions = createActions(...actionTypes, { prefix });
const reducerMap = {
    [actions.toggleSyncing]: (state, { payload }) => {
        return {
            ...state,
            syncing: payload,
        };
    },
}

const sync = handleActions(reducerMap, initialState)

export default sync;
