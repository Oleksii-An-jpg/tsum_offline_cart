import { useDispatch, useSelector } from 'react-redux';
import { getSync } from '../store/selectors';
import { actions } from '../store/reducers';

export const useSyncState = () => {
    const dispatch = useDispatch();
    const syncing = useSelector(getSync);
    const toggleSyncing = () => {
        dispatch(actions.toggleSyncing(!syncing));
    }

    return {
        syncing,
        toggleSyncing
    }
}
