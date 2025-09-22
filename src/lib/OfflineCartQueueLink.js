import { ApolloLink, Observable } from '@apollo/client';
import { GET_ITEM_COUNT_QUERY } from '@magento/venia-ui/lib/components/Header/cartTrigger.gql';
import toast from '@magento/venia-ui/lib/components/ToastContainer/toast';
import { actions } from '../store/reducers';

class OfflineQueueLink extends ApolloLink {
    constructor(store) {
        super();
        this.queue = [];
        this.store = store;

        this.store.subscribe(() => {
            if (this.store.getState().app.isOnline) {
                this.processQueue();
            }
        });
    }

    generateTempUid() {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    request(operation, forward) {
        const isOffline = !this.store.getState().app.isOnline;

        const { cart } = operation.getContext().cache.readQuery({ query: GET_ITEM_COUNT_QUERY });
        if (isOffline && operation.operationName === 'AddProductToCart') {
            return new Observable(observer => {
                const optimisticResult = this.generateOptimisticResponse(operation, cart);

                if (optimisticResult) {
                    // Return optimistic response immediately
                    observer.next({
                        data: optimisticResult,
                        loading: false,
                        networkStatus: 7
                    });
                    observer.complete();
                }

                // Queue for later execution
                this.queue.push({
                    operation,
                    forward,
                    onSuccess: null, // No observer since we already completed
                    onError: null
                });

                return () => {};
            });
        }

        if (isOffline && operation.operationName === 'MiniCartQuery') {
            return new Observable(observer => {
                // Generate optimistic mini cart response
                const optimisticResult = this.generateMiniCartOptimisticResponse();

                if (optimisticResult) {
                    observer.next({
                        data: optimisticResult,
                        loading: false,
                        networkStatus: 7
                    });
                    observer.complete();
                }

                return () => {};
            });
        }

        return forward(operation);
    }

    generateOptimisticResponse(operation, cart) {
        const { variables } = operation;

        if (!variables || !variables.product) {
            return null;
        }

        const { cartId, product } = variables;
        const { sku, quantity, selected_options } = product;

        // Generate a temporary UID for the new cart item
        const tempItemUid = this.generateTempUid();

        // Create optimistic cart item structure
        const optimisticCartItem = {
            uid: tempItemUid,
            product: {
                uid: this.generateTempUid(), // Temp product UID
                name: `${sku} Product`, // Placeholder name
                sku: sku,
                url_key: sku.toLowerCase(),
                thumbnail: {
                    url: "https://via.placeholder.com/150", // Placeholder image
                    __typename: "ProductImage"
                },
                stock_status: "IN_STOCK",
                variants: [], // Empty variants for optimistic response
                __typename: "ConfigurableProduct"
            },
            prices: {
                price: {
                    currency: "USD",
                    value: 0, // Placeholder price - will be updated when online
                    __typename: "Money"
                },
                total_item_discount: {
                    value: 0,
                    __typename: "Money"
                },
                __typename: "CartItemPrices"
            },
            quantity: quantity,
            configurable_options: this.generateConfigurableOptions(selected_options),
            __typename: "ConfigurableCartItem"
        };

        // Calculate new totals
        const newTotalQuantity = (cart?.total_quantity || 0) + quantity;

        const optimisticCart = {
            id: cartId,
            total_quantity: newTotalQuantity,
            total_summary_quantity_including_config: newTotalQuantity,
            __typename: "Cart",
            items: [
                ...(cart?.items || []),
                optimisticCartItem
            ]
        };

        // Store optimistic cart state for MiniCartQuery
        this.optimisticCartState = optimisticCart;

        return {
            addProductsToCart: {
                cart: optimisticCart,
                user_errors: [],
                __typename: "AddProductsToCartOutput"
            }
        };
    }

    generateConfigurableOptions(selectedOptions) {
        if (!selectedOptions || !Array.isArray(selectedOptions)) {
            return [];
        }

        return selectedOptions.map((optionUid, index) => ({
            configurable_product_option_uid: `temp_option_${index}`,
            option_label: `Option ${index + 1}`, // Placeholder label
            configurable_product_option_value_uid: optionUid,
            value_label: `Value ${index + 1}`, // Placeholder value label
            __typename: "SelectedConfigurableOption"
        }));
    }

    generateMiniCartOptimisticResponse() {
        // If we have optimistic cart state from AddProductToCart, use it
        if (this.optimisticCartState) {
            return {
                cart: this.optimisticCartState
            };
        }

        // Otherwise, get current cart from store
        const currentCart = this.getCurrentCartFromStore();

        if (!currentCart) {
            // Return empty cart structure if no current cart exists
            return {
                cart: {
                    id: null,
                    total_quantity: 0,
                    prices: {
                        subtotal_excluding_tax: {
                            currency: "USD",
                            value: 0,
                            __typename: "Money"
                        },
                        subtotal_including_tax: {
                            currency: "USD",
                            value: 0,
                            __typename: "Money"
                        },
                        __typename: "CartPrices"
                    },
                    items: [],
                    __typename: "Cart"
                }
            };
        }

        // Return the current cart state
        return {
            cart: currentCart
        };
    }

    getCurrentCartFromStore(cartId) {
        // Try to get current cart from Apollo cache or store
        // This is a placeholder - you'll need to implement based on your store structure
        try {
            const state = this.store.getState();

            // First, try to get from cart state
            let currentCart = state.cart?.data?.cart || null;

            // If no cart in state, try to get from Apollo cache
            if (!currentCart && cartId) {
                // You can implement Apollo cache reading here if needed
                // For now, create a basic cart structure
                currentCart = {
                    id: cartId,
                    total_quantity: 0,
                    prices: {
                        subtotal_excluding_tax: { currency: "USD", value: 0, __typename: "Money" },
                        subtotal_including_tax: { currency: "USD", value: 0, __typename: "Money" },
                        __typename: "CartPrices"
                    },
                    items: [],
                    __typename: "Cart"
                };
            }

            return currentCart;
        } catch (error) {
            console.warn('Could not retrieve current cart from store:', error);
            return null;
        }
    }

    processQueue() {
        // Clear optimistic state when processing queue (back online)
        this.optimisticCartState = null;
        const { sync } = this.store.getState();
        // this.store.dispatch(actions.toggleSyncing(true));

        // Process queued mutations when back online
        while (this.queue.length > 0) {
            const { operation, forward } = this.queue.shift();

            if (!sync.syncing) {
                this.store.dispatch(actions.toggleSyncing(true));
            }

            forward(operation).subscribe({
                next: (result) => {
                    console.log('Queued mutation succeeded:', result);
                    this.handleQueuedMutationSuccess(operation, result);
                    if (this.queue.length === 0) {
                        this.store.dispatch(actions.toggleSyncing(false));
                    }
                },
                error: (error) => {
                    console.error('Queued mutation failed:', error);
                    this.handleQueuedMutationError(operation, error);
                }
            });
        }
    }

    handleQueuedMutationSuccess(operation) {
        toast('Queued action processed successfully.', { type: 'success', message: operation.operationName });
    }

    handleQueuedMutationError(operation, error) {
        toast('Failed to process queued action. Please try again.', { type: 'error', message: error.message });
    }
}

export default OfflineQueueLink;
