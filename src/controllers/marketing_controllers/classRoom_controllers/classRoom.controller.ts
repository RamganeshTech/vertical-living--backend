import { Request, Response } from 'express';
import ClassRoomModel from '../../../models/marketing_models/classRoom_model/classRoom.model'; // Adjust path as needed

// --- 1. MAIN MODULE CONTROLLERS ---

// Create a new Main Module
export const createModule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { moduleName, description } = req.body;
        const { organizationId } = req.params; // Fixed destructuring here

        if (!organizationId) {
            res.status(401).json({ ok: false, message: 'Unauthorized: No organization ID found.' });
            return;
        }

        const newModule = new ClassRoomModel({
            organizationId,
            moduleName,
            description,
            tabs: [] // Initialize with empty tabs
        });

        const savedModule = await newModule.save();
        res.status(201).json({ ok: true, data: savedModule });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error creating module', error: error.message });
    }
};

// Get all Modules for a specific Organization
export const getAllModules = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId } = req.params;

        const modules = await ClassRoomModel.find({ organizationId }).select('-tabs.contentBlocks');

        res.status(200).json({ ok: true, data: modules });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error fetching modules', error: error.message });
    }
};

// Get a single Module by its _id
export const getModuleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId } = req.params;

        const module = await ClassRoomModel.findOne({ _id: moduleId, organizationId });

        if (!module) {
            res.status(404).json({ ok: false, message: 'Module not found' });
            return;
        }

        res.status(200).json({ ok: true, data: module });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error fetching module', error: error.message });
    }
};

// Delete a Main Module
export const deleteModule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId } = req.params;

        const deletedModule = await ClassRoomModel.findOneAndDelete({ _id: moduleId, organizationId });

        if (!deletedModule) {
            res.status(404).json({ ok: false, message: 'Module not found or unauthorized' });
            return;
        }

        res.status(200).json({ ok: true, data: { message: 'Module deleted successfully' } });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error deleting module', error: error.message });
    }
};

// Update Main Module
export const updateModule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId } = req.params;
        const { moduleName, description } = req.body;

        const updatedModule = await ClassRoomModel.findOneAndUpdate(
            { _id: moduleId, organizationId },
            { $set: { moduleName, description } },
            { new: true, runValidators: true }
        );

        if (!updatedModule) {
            res.status(404).json({ ok: false, message: 'Module not found or unauthorized.' });
            return;
        }

        res.status(200).json({ ok: true, data: updatedModule });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error updating module', error: error.message });
    }
};


// --- 2. TAB CONTROLLERS ---

// Create a new Tab
export const createTab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId } = req.params;
        const { title, order } = req.body;

        const moduleDoc = await ClassRoomModel.findOne({ _id: moduleId, organizationId });

        if (!moduleDoc) {
            res.status(404).json({ ok: false, message: 'Module not found' });
            return;
        }

        moduleDoc.tabs.push({
            title,
            order: order || 0,
            contentBlocks: []
        } as any);

        const updatedModule = await moduleDoc.save();
        const newTab = updatedModule.tabs[updatedModule.tabs.length - 1];
        
        res.status(201).json({ ok: true, data: newTab });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error creating tab', error: error.message });
    }
};

// Update Tab Information
export const updateTab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId, tabId } = req.params;
        const { title, order } = req.body;

        const moduleDoc = await ClassRoomModel.findOne({ _id: moduleId, organizationId });

        if (!moduleDoc) {
            res.status(404).json({ ok: false, message: 'Module not found.' });
            return;
        }

        const tab = (moduleDoc.tabs as any).id(tabId);

        if (!tab) {
            res.status(404).json({ ok: false, message: 'Tab not found.' });
            return;
        }

        if (title !== undefined) tab.title = title;
        if (order !== undefined) tab.order = order;

        await moduleDoc.save();

        res.status(200).json({ ok: true, data: tab });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error updating tab', error: error.message });
    }
};

// Delete a Tab
export const deleteTab = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId, tabId } = req.params;

        const moduleDoc = await ClassRoomModel.findOne({ _id: moduleId, organizationId });

        if (!moduleDoc) {
            res.status(404).json({ ok: false, message: 'Module not found' });
            return;
        }

        (moduleDoc.tabs as any).pull({ _id: tabId });
        await moduleDoc.save();

        res.status(200).json({ ok: true, data: { message: 'Tab deleted successfully' } });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error deleting tab', error: error.message });
    }
};


// --- 3. CONTENT BLOCK CONTROLLERS ---

// Create a Content Block
export const createContentBlock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId, tabId } = req.params;
        const { type, text, listItems, url, order } = req.body;

        const moduleDoc = await ClassRoomModel.findOne({ _id: moduleId, organizationId });

        if (!moduleDoc) {
            res.status(404).json({ ok: false, message: 'Module not found' });
            return;
        }

        const tab = (moduleDoc.tabs as any).id(tabId);

        if (!tab) {
            res.status(404).json({ ok: false, message: 'Tab not found' });
            return;
        }

        tab.contentBlocks.push({
            type,
            text,
            listItems,
            url,
            order: order || 0
        } as any);

        await moduleDoc.save();
        const newBlock = tab.contentBlocks[tab.contentBlocks.length - 1];

        res.status(201).json({ ok: true, data: newBlock });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error adding content block', error: error.message });
    }
};

// Update Content Block
export const updateContentBlock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { organizationId, moduleId, tabId, contentId } = req.params;
        const { type, text, listItems, url, order } = req.body;

        const moduleDoc = await ClassRoomModel.findOne({ _id: moduleId, organizationId });

        if (!moduleDoc) {
            res.status(404).json({ ok: false, message: 'Module not found.' });
            return;
        }

        const tab = (moduleDoc.tabs as any).id(tabId);

        if (!tab) {
            res.status(404).json({ ok: false, message: 'Tab not found.' });
            return;
        }

        const contentBlock = tab.contentBlocks.id(contentId);

        if (!contentBlock) {
            res.status(404).json({ ok: false, message: 'Content block not found.' });
            return;
        }

        if (type !== undefined) contentBlock.type = type;
        if (text !== undefined) contentBlock.text = text;
        if (listItems !== undefined) contentBlock.listItems = listItems;
        if (url !== undefined) contentBlock.url = url;
        if (order !== undefined) contentBlock.order = order;

        await moduleDoc.save();

        res.status(200).json({ ok: true, data: contentBlock });
    } catch (error: any) {
        res.status(500).json({ ok: false, message: 'Error updating content block', error: error.message });
    }
};