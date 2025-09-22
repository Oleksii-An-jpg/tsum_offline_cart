const { Targetables } = require("@magento/pwa-buildpack");

/* eslint-disable */
/**
 * Custom interceptors for the project.
 *
 * This project has a section in its package.json:
 *    "pwa-studio": {
 *        "targets": {
 *            "intercept": "./local-intercept.js"
 *        }
 *    }
 *
 * This instructs Buildpack to invoke this file during the intercept phase,
 * as the very last intercept to run.
 *
 * A project can intercept targets from any of its dependencies. In a project
 * with many customizations, this function would tap those targets and add
 * or modify functionality from its dependencies.
 */

function localIntercept(targets) {
    const targetables = Targetables.using(targets);

    // Target the CartTrigger component
    const CartTrigger = targetables.reactComponent(
        '@magento/venia-ui/lib/components/Header/cartTrigger.js'
    );

    CartTrigger.addImport('import OnlineIndicator from "src/components/Header/onlineIndicator"');
    CartTrigger.addImport(
        "import { useAppContext } from '@magento/peregrine/lib/context/app'"
    );

    // Add imports for custom state components

    // Insert custom hook usage after existing hooks
    CartTrigger.insertAfterSource(
        'const {\n' +
            '        handleLinkClick,\n' +
            '        handleTriggerClick,\n' +
            '        itemCount,\n' +
            '        miniCartRef,\n' +
            '        miniCartIsOpen,\n' +
            '        hideCartTrigger,\n' +
            '        setMiniCartIsOpen,\n' +
            '        miniCartTriggerRef\n' +
            '    } = useCartTrigger({\n' +
            '        queries: {\n' +
            '            getItemCountQuery: GET_ITEM_COUNT_QUERY\n' +
            '        }\n' +
            '    });',
        `
    const [appState] = useAppContext();
    const {
        isOnline
    } = appState;`
    );

    // Add custom state UI before the cart icon
    CartTrigger.insertBeforeSource(
        '<Icon src={ShoppingCartIcon} />',
        `<OnlineIndicator isOnline={isOnline} />`
    );

    // Alternatively, wrap the entire cart trigger content
    // CartTrigger.wrapWithComponent('div', { className: 'enhanced-cart-trigger' });
}

module.exports = localIntercept;
