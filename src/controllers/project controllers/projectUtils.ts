import redisClient from "../../config/redisClient";
import ProjectModel from "../../models/project model/project.model";



export const getProjectUtil = async (organizationId: string) => {
    try {

        const cacheKey = `projects:${organizationId}`;

        // await redisClient.del(`projects:${organizationId}`);
        let cachedData = await redisClient.get(cacheKey);


        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            // return res.status(200).json({ message: "Projects retrieved from cache", data: parsedData, ok: true });
            return { message: "Projects retrieved from cache", data: parsedData, ok: true }
        }

        const projects = await ProjectModel.find({ organizationId })

        await redisClient.set(cacheKey, JSON.stringify(projects), { EX: 300 }); // expires in 5 mins (put in secondsj)
        return { message: "Projects retrived successfully", data: projects, ok: true }
    }
    catch (error: any) {
        console.log("error form getProjects", error)
        throw error
    }

}


export const getProjectUtilWithPagination = async (
    organizationId: string, 
    queryParams: any
) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            priority, 
            projectName, 
            startDate, 
            endDate ,
            isCompleted
        } = queryParams;

        // 1. Create a Unique Cache Key based on all parameters
        // This ensures filters and pages are cached separately
        const filterString = JSON.stringify(queryParams);
        const cacheKey = `projects:${organizationId}:${filterString}`;

        let cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return { message: "Projects retrieved from cache", data: JSON.parse(cachedData), ok: true };
        }

        // 2. Build Dynamic Query Filter
        const query: any = { organizationId };

        if (status) query["projectInformation.status"] = status;
        if (priority) query["projectInformation.priority"] = priority;
        if (projectName) query.projectName = { $regex: projectName, $options: "i" }; // Case-insensitive search

        if (isCompleted === 'true' || isCompleted === true) {
            query.completionPercentage = 100;
        }
        
        // Date Range Filtering
        if (startDate || endDate) {
            query["projectInformation.startDate"] = {};
            if (startDate) query["projectInformation.startDate"].$gte = new Date(startDate);
            if (endDate) query["projectInformation.startDate"].$lte = new Date(endDate);
        }

        // 3. Execute Paginated Query
        const skip = (Number(page) - 1) * Number(limit);
        
        const [projects, totalCount] = await Promise.all([
            ProjectModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ProjectModel.countDocuments(query)
        ]);

        const result = {
            projects,
            pagination: {
                totalProjects: totalCount,
                currentPage: Number(page),
                totalPages: Math.ceil(totalCount / Number(limit)),
                hasNextPage: skip + projects.length < totalCount
            }
        };

        // 4. Set Cache (Expire in 5 mins)
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });

        return { message: "Projects retrieved successfully", data: result, ok: true };
    } catch (error: any) {
        console.error("Error in getProjectUtil:", error);
        throw error;
    }
};