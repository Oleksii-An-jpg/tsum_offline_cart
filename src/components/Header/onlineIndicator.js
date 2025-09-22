import React from 'react';
import { bool } from 'prop-types';
import { WifiOff, Wifi, Loader } from 'react-feather';
import Icon from '@magento/venia-ui/lib/components/Icon';
import { useStyle } from '@magento/venia-ui/lib/classify';
import defaultClasses from './onlineIndicator.module.css';
import { useSyncState } from '../../talons/useSync';

const OnlineIndicator = ({ isOnline }) => {
    const { syncing } = useSyncState();
    const classes = useStyle(defaultClasses);
    return (
        <div className={classes.indicator}>
            <Icon size={18} classes={{
                icon: isOnline ? classes.online : classes.offline,
            }} src={syncing ? Loader : isOnline ? Wifi : WifiOff} />
        </div>
    );
}

OnlineIndicator.propTypes = {
    isOnline: bool.isRequired
}

export default OnlineIndicator;
