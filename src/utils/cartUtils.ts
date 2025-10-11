import MaterialInventoryCart from "../models/Material Inventory Model/materialInventoryCart.model";

export const cartUtils = {
    // Find available cart or determine if new cart needs to be created
    async findOrShouldCreateCart(organizationId: string, projectId: string) {
        // Get all carts for this org and project
        const existingCarts = await MaterialInventoryCart.find({
            organizationId,
            projectId
        });

        if (existingCarts.length === 0) {
            // No carts exist, should create new one
            return {
                shouldCreate: true,
                existingCart: null
            };
        }

        // Check if there's a cart without pdfLink
        const activeCart = existingCarts.find(cart => !cart.pdfLink);
        if (activeCart) {
            return {
                shouldCreate: false,
                existingCart: activeCart
            };
        }

        // All carts have pdfLink, should create new one
        return {
            shouldCreate: true,
            existingCart: null
        };
    }
};