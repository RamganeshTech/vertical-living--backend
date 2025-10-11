import { Request, Response } from "express";
import MaterialInventoryCart from "../../models/Material Inventory Model/materialInventoryCart.model";
import { Types } from "mongoose";
// import { MaterialInventoryModel } from "../../../models/Material Inventory Model/MaterialInventory.model";
import { cartUtils } from "../../utils/cartUtils";
import { MaterialInventoryModel } from "../../models/Material Inventory Model/MaterialInventory.model";
import { generateMaterialInventoryCartPdf } from "./pdfGenerateMaterialInventoryCart";

// Add item to cart
export const addToCart = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId, projectId, productId, quantity, specification } = req.body;

        if (!organizationId || !projectId || !productId || !quantity) {
            return res.status(400).json({
                ok: false,
                message: "Missing required fields"
            });
        }

        // // Get the product details
        // const product = await MaterialInventoryModel.findById(productId);
        // if (!product) {
        //     return res.status(404).json({
        //         ok: false,
        //         message: "Product not found"
        //     });
        // }

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
            item => item.productId.toString() === productId
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
        console.log("sorted things", cart)

        if (!cart) {
            return res.status(200).json({
                ok: true,
                message: "No active cart found",
                data: null
            });
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
        const { cartId, productId, quantity } = req.body;

        if (!cartId || !productId || !quantity) {
            return res.status(400).json({
                ok: false,
                message: "Missing required fields"
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
            item => item.productId.toString() === productId
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
        const { cartId, productId } = req.body;

        if (!cartId || !productId) {
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
            item.productId.toString() !== productId
        );

        // Recalculate total cost (sum of all singleItemCosts)
        cart.totalCost = cart.items.reduce((total, item) =>
            total + item.singleItemCost, 0
        );

        await cart.save();

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

        res.status(200).json({ok:success, data: {
            url: fileUrl,
            fileName: fileName
        }})

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: "Error retrieving cart history",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
}