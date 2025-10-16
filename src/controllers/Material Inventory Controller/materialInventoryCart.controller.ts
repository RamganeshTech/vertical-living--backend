import { Request, Response } from "express";
import MaterialInventoryCart from "../../models/Material Inventory Model/materialInventoryCart.model";
import { Types } from "mongoose";
// import { MaterialInventoryModel } from "../../../models/Material Inventory Model/MaterialInventory.model";
import { cartUtils } from "../../utils/cartUtils";
import { MaterialInventoryModel } from "../../models/Material Inventory Model/MaterialInventory.model";
import { generateMaterialInventoryCartPdf } from "./pdfGenerateMaterialInventoryCart";
import redisClient from "../../config/redisClient";




// Cache key generators
const getCacheKeys = {
    cart: (organizationId: string, projectId: string) =>
        `materialcart:${organizationId}:${projectId}`,
    cartHistory: (organizationId: string, projectId: string) =>
        `materialcart-history:${organizationId}:${projectId}`,
    cartById: (cartId: string) =>
        `materialcart-id:${cartId}`
};

// Cache TTL (in seconds)
const CACHE_TTL = {
    CART: 300, // 5 minutes
    HISTORY: 600 // 10 minutes
};

// Helper function to invalidate related cache
const invalidateCartCache = async (organizationId: string, projectId: string, cartId?: string) => {
    const keysToDelete = [
        getCacheKeys.cart(organizationId, projectId),
        getCacheKeys.cartHistory(organizationId, projectId)
    ];

    if (cartId) {
        keysToDelete.push(getCacheKeys.cartById(cartId));
    }

    try {
        await Promise.all(keysToDelete.map(key => redisClient.del(key)));
    } catch (error) {
        console.error("Error invalidating cache:", error);
    }
};



// Add item to cart
export const addToCart = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId, productId, quantity, specification } = req.body;

        // console.log("specififcaton", specification)


        if (!organizationId || !projectId || !productId || !quantity || !specification?.itemCode) {
            return res.status(400).json({
                ok: false,
                message: "Missing required fields"
            });
        }

        // Check for existing cart or need to create new one
        const { shouldCreate, existingCart } = await cartUtils.findOrShouldCreateCart(organizationId, projectId);

        // Initialize cart
        const cart = shouldCreate
            ? new MaterialInventoryCart({
                organizationId,
                projectId,
                items: [],
                status: 'pending',
                totalCost: 0
            })
            : existingCart!; // We can safely use ! here because we know existingCart exists when shouldCreate is false


        // Check if item already exists in cart
        const existingItemIndex = cart?.items?.findIndex(
            item => item.specification.itemCode.toString() === specification?.itemCode
        );

        if (existingItemIndex > -1) {
            // Update existing item
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].singleItemCost = specification.mrp * cart.items[existingItemIndex].quantity;
        } else {
            // Calculate item cost
            const singleItemCost = specification.mrp * quantity || 0;

            // Add new item
            cart.items.push({
                productId: new Types.ObjectId(productId),
                quantity,
                specification: specification,
                singleItemCost,
                orderedBefore: false // Added the required field
            });
        }

        // Calculate total cost
        cart.totalCost = cart.items.reduce((total, item) =>
            total + item.singleItemCost, 0
        );

        await cart.save();

        // Invalidate cache after adding item
        await invalidateCartCache(organizationId, projectId, (cart as any)._id.toString());

        return res.status(200).json({
            ok: true,
            message: "Item added to cart successfully",
            data: cart
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error adding item to cart",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Get cart
export const getCart = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId } = req.query;

        if (!organizationId || !projectId) {
            return res.status(400).json({
                ok: false,
                message: "Organization ID and Project ID are required"
            });
        }

        // Generate cache key
        const cacheKey = getCacheKeys.cart(String(organizationId), String(projectId));

        // Try to get from cache
        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                return res.status(200).json({
                    ok: true,
                    message: "Cart retrieved successfully (from cache)",
                    data: JSON.parse(cachedData)
                });
            }
        } catch (redisError) {
            console.error("Redis get error:", redisError);
            // Continue with database query if Redis fails
        }

        // Find active cart (no pdfLink)
        const cart = await MaterialInventoryCart.findOne({
            organizationId,
            projectId,
            // pdfLink: { $exists: false }
            $or: [
                { pdfLink: null },
                { pdfLink: { $exists: false } }
            ]
        })
        // .populate('items.productId');
        // console.log("sorted things", cart)

        if (!cart) {

            try {
                // await redisClient.setex(cacheKey, CACHE_TTL.CART, JSON.stringify(null));
                await redisClient.set(cacheKey, JSON.stringify(null), { EX: CACHE_TTL.CART });
            } catch (redisError) {
                console.error("Redis set error:", redisError);
            }

            return res.status(200).json({
                ok: true,
                message: "No active cart found",
                data: null
            });
        }

        // Cache the result
        try {
            // await redisClient.setex(cacheKey, CACHE_TTL.CART, JSON.stringify(cart.toObject()));
            const cartObject = cart.toObject();

            await redisClient.set(cacheKey, JSON.stringify(cartObject), { EX: CACHE_TTL.CART });

            // await redisClient.set(cacheKey, JSON.stringify(doc), { EX: 60 * 10 }); // cache for 10 min

        } catch (redisError) {
            console.error("Redis set error:", redisError);
        }

        return res.status(200).json({
            ok: true,
            message: "Cart retrieved successfully",
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error retrieving cart",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Update cart item quantity
export const updateCartItemQuantity = async (req: Request, res: Response): Promise<any> => {
    try {
        const { cartId, itemCode, quantity } = req.body;

        if (!cartId || !itemCode || !quantity) {
            return res.status(400).json({
                ok: false,
                message: "Missing required fields"
            });
        }


        if (quantity < 1) {
            return res.status(400).json({
                ok: false,
                message: "Quantity must be at least 1"
            });
        }

        const cart = await MaterialInventoryCart.findById(cartId);
        if (!cart) {
            return res.status(404).json({
                ok: false,
                message: "Cart not found"
            });
        }

        // Find item in cart
        const itemIndex = cart.items.findIndex(
            item => item.specification.itemCode.toString() === itemCode
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                ok: false,
                message: "Item not found in cart"
            });
        }

        // Update quantity and recalculate singleItemCost
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].singleItemCost = cart.items[itemIndex].specification.mrp * quantity;

        // Recalculate total cost (sum of all singleItemCosts)
        cart.totalCost = cart.items.reduce((total, item) =>
            total + item.singleItemCost, 0
        );

        await cart.save();


        // Invalidate cache after update
        await invalidateCartCache(
            cart.organizationId.toString(),
            cart.projectId.toString(),
            cartId
        );

        return res.status(200).json({
            ok: true,
            message: "Cart item quantity updated successfully",
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error updating cart item",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Remove item from cart
export const removeCartItem = async (req: Request, res: Response): Promise<any> => {
    try {
        const { cartId, itemCode } = req.body;

        if (!cartId || !itemCode) {
            return res.status(400).json({
                ok: false,
                message: "Cart ID and Product ID are required"
            });
        }

        const cart = await MaterialInventoryCart.findById(cartId);
        if (!cart) {
            return res.status(404).json({
                ok: false,
                message: "Cart not found"
            });
        }

        // Remove item
        cart.items = cart.items.filter(item =>
            item.specification.itemCode.toString() !== itemCode
        );

        // Recalculate total cost (sum of all singleItemCosts)
        cart.totalCost = cart.items.reduce((total, item) =>
            total + item.singleItemCost, 0
        );

        await cart.save();

        // Invalidate cache after removing item
        await invalidateCartCache(
            cart.organizationId.toString(),
            cart.projectId.toString(),
            cartId
        );

        return res.status(200).json({
            ok: true,
            message: "Item removed from cart successfully",
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error removing cart item",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Get cart history for a project
export const getCartHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId } = req.query;

        if (!organizationId || !projectId) {
            return res.status(400).json({
                ok: false,
                message: "Organization ID and Project ID are required"
            });
        }

        // Generate cache key
        const cacheKey = getCacheKeys.cartHistory(String(organizationId), String(projectId));


        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                return res.status(200).json({
                    ok: true,
                    message: "Cart history retrieved successfully (from cache)",
                    data: JSON.parse(cachedData)
                });
            }
        } catch (redisError) {
            console.error("Redis get error:", redisError);
            // Continue with database query if Redis fails
        }


        // Find all carts with pdfLink (completed orders)
        const carts = await MaterialInventoryCart.find({
            organizationId,
            projectId,
            // pdfLink: { $exists: true }
            $or: [
                { pdfLink: null },
                { pdfLink: { $exists: false } }
            ]
        }).sort({ createdAt: -1 });

        // // Cache the result
        // try {
        //     await redisClient.setex(cacheKey, CACHE_TTL.HISTORY, JSON.stringify(carts));
        // } catch (redisError) {
        //     console.error("Redis set error:", redisError);
        // }


          // Convert to plain objects for caching
        const cartsObjects = carts.map(cart => cart.toObject());

        // Cache the result using the correct syntax
        try {
            await redisClient.set(cacheKey, JSON.stringify(cartsObjects), { EX: CACHE_TTL.HISTORY });
            console.log("History cached successfully"); // Debug log
        } catch (redisError) {
            console.error("Redis set error:", redisError);
        }

        return res.status(200).json({
            ok: true,
            message: "Cart history retrieved successfully",
            data: carts
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error retrieving cart history",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


export const generateMaterialInventPdf = async (req: Request, res: Response): Promise<any> => {
    try {

        const { id, projectId } = req.params
        const { success,
            fileUrl,
            fileName,
            updatedDoc } = await generateMaterialInventoryCartPdf({ id, projectId })


        if (!success) {
            return res.status(404).json({ message: "cart items not found", ok: false })
        }


        // Invalidate cache after PDF generation (as it might update the cart with pdfLink)
        if (updatedDoc) {
            await invalidateCartCache(
                (updatedDoc as any)?.organizationId.toString(),
                (updatedDoc as any)?.projectId.toString(),
                id
            );
        }



        res.status(200).json({
            ok: success, data: {
                url: fileUrl,
                fileName: fileName
            }
        })

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: "Error retrieving cart history",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
}