

// utils/cacheHelper.ts
import crypto from 'crypto';
import redisClient from '../../config/redisClient';



// utils/cacheKeys.ts
const prefix = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

export const getCacheKey = {
    // Single task
    task: (taskId: string) => `${prefix}:task:${taskId}`,

    // Task list with filters
    taskList: (orgId: string, filters: string = '') => 
        `${prefix}:tasks:org:${orgId}${filters ? `:${filters}` : ''}`,

    // Staff-specific tasks
    staffTasks: (staffId: string, orgId: string, filters: string = '') => 
        `${prefix}:tasks:staff:${staffId}:org:${orgId}${filters ? `:${filters}` : ''}`,

    // Task suggestions (embeddings)
    taskSuggestion: (title: string) => {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(title).digest('hex');
        return `${prefix}:suggestion:${hash}`;
    },

    // Tracking sets for invalidation
    taskTrackingSet: (orgId: string) => `${prefix}:tasks:org:${orgId}:tracking`,

    staffTaskTrackingSet: (staffId: string, orgId: string) => 
        `${prefix}:tasks:staff:${staffId}:org:${orgId}:tracking`
};

// TTL Constants
export const CACHE_TTL = {
    TASK_SINGLE: 60 * 30,        // 30 minutes
    TASK_LIST: 60 * 10,          // 10 minutes
    SUGGESTION: 60 * 60 * 24,    // 24 hours
    SHORT: 60 * 5,               // 5 minutes
};


/**
 * Safe get with error handling
 */
export const getCachedData = async <T>(key: string): Promise<T | null> => {
    try {
        const cached = await redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error(`Redis GET error for key ${key}:`, error);
        return null;
    }
};

/**
 * Safe set with error handling
 */
export const setCachedData = async (key: string, data: any, ttl: number): Promise<void> => {
    try {
        await redisClient.set(key, JSON.stringify(data), { EX: ttl });
    } catch (error) {
        console.error(`Redis SET error for key ${key}:`, error);
    }
};

/**
 * Safe delete with error handling
 */
export const deleteCachedData = async (keys: string | string[]): Promise<void> => {
    try {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        if (keyArray.length > 0) {
            await redisClient.del(keyArray);
        }
    } catch (error) {
        console.error('Redis DEL error:', error);
    }
};

/**
 * Invalidate all tracked keys
 */
export const invalidateTrackedKeys = async (trackingSetKey: string): Promise<void> => {
    try {
        const keys = await redisClient.sMembers(trackingSetKey);
        if (keys.length > 0) {
            await deleteCachedData([...keys, trackingSetKey]);
        }
    } catch (error) {
        console.error('Error invalidating tracked keys:', error);
    }
};

/**
 * Add key to tracking set
 */
export const trackCacheKey = async (trackingSetKey: string, cacheKey: string): Promise<void> => {
    try {
        await redisClient.sAdd(trackingSetKey, cacheKey);
    } catch (error) {
        console.error('Error tracking key:', error);
    }
};

/**
 * Generate filter hash for cache key
 */
export const generateFilterHash = (filters: any): string => {
    const sortedFilters = Object.keys(filters)
        .sort()
        .reduce((acc, key) => {
            if (filters[key] !== undefined && filters[key] !== null) {
                acc[key] = filters[key];
            }
            return acc;
        }, {} as any);

    return crypto
        .createHash('md5')
        .update(JSON.stringify(sortedFilters))
        .digest('hex')
        .substring(0, 8);
};