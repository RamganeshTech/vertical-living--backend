import { Request, Response } from 'express';
import { MaterialInventoryModel } from '../../models/Material Inventory Model/MaterialInventory.model';
import mongoose, { Types } from 'mongoose';
import redisClient from '../../config/redisClient';


// Utility to delete all keys for an organization
async function clearMaterialInventoryCache(organizationId: string | Types.ObjectId) {
    const pattern = `materialInventory:${organizationId}*`;
    const keys: string[] = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern })) {
        if (Array.isArray(key)) {
            keys.push(...key);
        } else {
            keys.push(key);
        }
    }
    if (keys.length === 1) {
        await redisClient.del(keys[0]);
    } else if (keys.length > 1) {
        for (const key of keys) {
            await redisClient.del(key);
        }
    }
}


const deleteSingleRedis = async (id: string) => {
    const cacheKey = `materialInventory:single:${id}`;
    await redisClient.del(cacheKey)
}


// 1. Create Material Inventory
export const createMaterialInventory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params
        const { ...specification } = req.body;
        if (!organizationId) {
            return res.status(400).json({ message: 'organizationId is required', ok: false });
        }
        if (specification.itemCode) {
            const exists = await MaterialInventoryModel.findOne({
                organizationId,
                'specification.itemCode': specification.itemCode,
            });
            if (exists) {
                return res.status(409).json({ message: 'Item with this itemCode already exists in this organization', ok: false });
            }
        }
        const doc = await MaterialInventoryModel.create({ organizationId, specification });
        // Invalidate cache for this org
        // await redisClient.del(`materialInventory:${organizationId}`);
        await clearMaterialInventoryCache(organizationId)
        return res.status(201).json({ data: doc, ok: true, message: 'Created successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', ok: false });
    }
};

// 2. Update Material Inventory by _id
export const updateMaterialInventory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { specification } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid id', ok: false });
        }
        const updated = await MaterialInventoryModel.findByIdAndUpdate(
            id,
            { $set: { specification } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Document not found', ok: false });
        }
        // Invalidate cache for this org
        if (updated.organizationId) {
            // await redisClient.del(`materialInventory:${updated.organizationId}`);
            await clearMaterialInventoryCache(updated.organizationId)
            await deleteSingleRedis(id)
        }
        return res.status(200).json({ data: updated, ok: true, message: 'Updated successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', ok: false });
    }
};

// 3. Delete Material Inventory by _id
export const deleteMaterialInventory = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid id', ok: false });
        }
        const deleted = await MaterialInventoryModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Document not found', ok: false });
        }
        // Invalidate cache for this org
        if (deleted.organizationId) {
            // await redisClient.del(`materialInventory:${deleted.organizationId}`);
            await clearMaterialInventoryCache(deleted.organizationId)
            await deleteSingleRedis(id)
        }
        return res.status(200).json({ data: deleted, ok: true, message: 'Deleted successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', ok: false });
    }
};

// 4. Get single Material Inventory by _id
export const getMaterialInventoryById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid id', ok: false });
        }
        // Try Redis cache first
        const cacheKey = `materialInventory:single:${id}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.status(200).json({ data: JSON.parse(cached), ok: true, message: 'Fetched from cache' });
        }
        const doc = await MaterialInventoryModel.findById(id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found', ok: false });
        }
        await redisClient.set(cacheKey, JSON.stringify(doc), { EX: 60 * 10 }); // cache for 10 min
        return res.status(200).json({ data: doc, ok: true, message: 'Fetched successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', ok: false });
    }
};

// 5. Get all Material Inventory by organizationId with pagination, filters, and search
export const getMaterialInventories = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            organizationId,
            page = 1,
            limit = 20,
            category,
            subcategory,
            minMrp,
            maxMrp,
            model,
            watt,
            itemCode,
            search,
            brand,
            type
        } = req.query;

        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'organizationId is required', ok: false });
        }
        console.log("called once ")
        const query: any = { organizationId };
        if (category) query['specification.category'] = category;
        if (subcategory) query['specification.subcategory'] = subcategory;
        if (brand) query['specification.brand'] = brand;
        // if (mrp) query['specification.mrp'] = Number(mrp);

        // if (minMrp || maxMrp) {
        //     query['specification.mrp'] = {};
        //     if (minMrp) query['specification.mrp'].$gte = Number(minMrp);
        //     if (maxMrp) query['specification.mrp'].$lte = Number(maxMrp);
        // }


        if (minMrp !== undefined || maxMrp !== undefined) {
            const hasRealMinMrp = minMrp !== undefined && Number(minMrp) >= 0;
            const hasRealMaxMrp = maxMrp !== undefined && Number(maxMrp) <= 100000;
                       
            if (hasRealMinMrp || hasRealMaxMrp) {
                const mrpCondition: any = {};
                if (hasRealMinMrp) mrpCondition.$gte = Number(minMrp);
                if (hasRealMaxMrp) mrpCondition.$lte = Number(maxMrp);

                   // Query BOTH locations: specification.mrp (lights) OR specification.variants.mrp (switches/sockets)
                query.$or = [
                    { 'specification.mrp': mrpCondition },  // For lights
                    {
                        'specification.variants': {
                            $elemMatch: { mrp: mrpCondition }
                        }
                    }  // For switches/sockets/regulators - using $elemMatch for array
                ];
            }
        }
        if (model) query['specification.model'] = model;
        if (watt) query['specification.watt'] = Number(watt);
        if (itemCode) query['specification.itemCode'] = itemCode;
        if (type) query['specification.type'] = type;
        if (search && typeof search === 'string') {
            query.$or = [
                { 'specification.itemCode': { $regex: search, $options: 'i' } },
                { 'specification.subcategory': { $regex: search, $options: 'i' } },
                { 'specification.model': { $regex: search, $options: 'i' } },
                { 'specification.brand': { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);


        // Add logging
        console.log('Query params:', {
            page: Number(page),
            limit: Number(limit),
            skip,
            queryFilters: JSON.stringify(query)
        });



        const cacheKey = `materialInventory:${organizationId}:page:${page}:limit:${limit}:cat:${category || ''}:type:${type || ""}:subcat:${subcategory || ''}:brand:${brand || ""}:minMrp:${minMrp || ''}:maxMrp:${maxMrp || ''}:model:${model || ''}:watt:${watt || ''}:itemCode:${itemCode || ''}:search:${search || ''}`;
        // await redisClient.del(cacheKey)
        // Try Redis cache first
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return res.status(200).json({ ...parsed, ok: true, message: 'Fetched from cache' });
        }

        const docs = await MaterialInventoryModel.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        const total = await MaterialInventoryModel.countDocuments(query);

        const totalPages = Math.ceil(total / Number(limit));
        // IMPORTANT: Add detailed logging
        console.log('Query results:', {
            docsFound: docs.length,
            total,
            currentPage: Number(page),
            totalPages,
            hasMorePages: Number(page) < totalPages,
            calculation: `${total} / ${Number(limit)} = ${totalPages} pages`
        });



        const response = {
            data: docs,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasNextPage: Number(page) < totalPages // Explicitly add this
        };
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 10 }); // cache for 5 min
        return res.status(200).json({ ...response, ok: true, message: 'Fetched successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', ok: false });
    }
};
