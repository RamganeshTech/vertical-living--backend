import { validateEmail, validateMongoId, validatePAN, validatePhone, ValidationError, ValidationResult } from "../Customer Accounts Controllers/customerAccoutsValidation";

export const validateCreateVendor = (data: any): ValidationResult => {
    const errors: ValidationError[] = [];

    // organizationId validation
    if (!data?.organizationId || !validateMongoId(data?.organizationId)) {
        errors.push({ field: 'organizationId', message: 'Invalid organization Id format' });
    }
    
    // projectId validation
    if (data?.projectId && !validateMongoId(data.projectId)) {
        // errors.push({ field: 'projectId', message: 'Project ID is required' });
        errors.push({ field: 'projectId', message: 'Invalid project ID format' });
    }

    // clientId validation
    if (data?.clientId && !validateMongoId(data.clientId)) {
        // errors.push({ field: 'clientId', message: 'Client ID is required' });
        errors.push({ field: 'clientId', message: 'Invalid client ID format' });
    // } else if () {
    }

    // Business vs Individual specific validations
    // if (data.customerType === 'business') {
        // if (data?.companyName || data.companyName.trim() === '') {
        //     errors.push({ field: 'companyName', message: 'Company name is required for business customers' });
        // }
    // } 
    // else if (data.customerType === 'individual') {
        if (!data.firstName || data.firstName.trim() === '') {
            errors.push({ field: 'firstName', message: 'First name is required for individual customers' });
        }
        // if (!data.lastName || data.lastName.trim() === '') {
        //     errors.push({ field: 'lastName', message: 'Last name is required for individual customers' });
        // }
    

    // Email validation (optional but must be valid if provided)
    if (data.email && data.email.trim() !== '') {
        if (!validateEmail(data.email)) {
            errors.push({ field: 'email', message: 'Invalid email format' });
        }
    }

    // Phone validation (optional but must be valid if provided)
    if (data.phone) {
        if (data.phone.work && data.phone.work.trim() !== '') {
            if (!validatePhone(data.phone.work)) {
                errors.push({ field: 'phone.work', message: 'Invalid work phone format' });
            }
        }
        if (data.phone.mobile && data.phone.mobile.trim() !== '') {
            if (!validatePhone(data.phone.mobile)) {
                errors.push({ field: 'phone.mobile', message: 'Invalid mobile phone format' });
            }
        }
    }

    // PAN validation (optional but must be valid if provided)
    if (data.pan && data.pan.trim() !== '') {
        if (!validatePAN(data.pan)) {
            errors.push({ field: 'pan', message: 'Invalid PAN format (e.g., ABCDE1234F)' });
        }
    }

    // Opening balance validation
    // if (data.openingBalance !== undefined && data.openingBalance !== null) {
    //     if (typeof data.openingBalance !== 'number' || isNaN(data.openingBalance)) {
    //         errors.push({ field: 'openingBalance', message: 'Opening balance must be a valid number' });
    //     }
    // }

    // Documents validation
    // if (data.documents && Array.isArray(data.documents)) {
    //     data.documents.forEach((doc: any, index: number) => {
    //         if (!doc.type) {
    //             errors.push({ field: `documents[${index}].type`, message: 'Document type is required' });
    //         } else if (!validateFileType(doc.type)) {
    //             errors.push({ field: `documents[${index}].type`, message: 'Document type must be "image" or "pdf"' });
    //         }
    //         if (!doc.url || doc.url.trim() === '') {
    //             errors.push({ field: `documents[${index}].url`, message: 'Document URL is required' });
    //         }
    //     });
    // }

    return {
        isValid: errors.length === 0,
        errors
    };
};

export const validateUpdateVendor = (data: any): ValidationResult => {
    const errors: ValidationError[] = [];

   

      // organizationId validation
    if (!data?.organizationId || !validateMongoId(data?.organizationId)) {
        errors.push({ field: 'organizationId', message: 'Invalid organization Id format' });
    }
    

    // projectId validation (if provided)
    if (data.projectId && !validateMongoId(data.projectId)) {
        errors.push({ field: 'projectId', message: 'Invalid project ID format' });
    }

    // clientId validation (if provided)
    if (data.clientId && !validateMongoId(data.clientId)) {
        errors.push({ field: 'clientId', message: 'Invalid client ID format' });
    }

    // Email validation (if provided)
    if (data.email && data.email.trim() !== '' && data.email !== null) {
        if (!validateEmail(data.email)) {
            errors.push({ field: 'email', message: 'Invalid email format' });
        }
    }

    // Phone validation (if provided)
    if (data.phone) {
        if (data.phone.work && data.phone.work.trim() !== '' && data.phone.work !== null) {
            if (!validatePhone(data.phone.work)) {
                errors.push({ field: 'phone.work', message: 'Invalid work phone format' });
            }
        }
        if (data.phone.mobile && data.phone.mobile.trim() !== '' && data.phone.mobile !== null) {
            if (!validatePhone(data.phone.mobile)) {
                errors.push({ field: 'phone.mobile', message: 'Invalid mobile phone format' });
            }
        }
    }

    // PAN validation (if provided)
    if (data.pan && data.pan.trim() !== '' && data.pan !== null) {
        if (!validatePAN(data.pan)) {
            errors.push({ field: 'pan', message: 'Invalid PAN format (e.g., ABCDE1234F)' });
        }
    }

    // Opening balance validation (if provided)
    // if (data.openingBalance !== undefined && data.openingBalance !== null) {
    //     if (typeof data.openingBalance !== 'number' || isNaN(data.openingBalance)) {
    //         errors.push({ field: 'openingBalance', message: 'Opening balance must be a valid number' });
    //     }
    // }

    // Documents validation (if provided)
    // if (data.documents && Array.isArray(data.documents)) {
    //     data.documents.forEach((doc: any, index: number) => {
    //         if (doc.type && !validateFileType(doc.type)) {
    //             errors.push({ field: `documents[${index}].type`, message: 'Document type must be "image" or "pdf"' });
    //         }
    //         if (!doc.url || doc.url.trim() === '') {
    //             errors.push({ field: `documents[${index}].url`, message: 'Document URL is required' });
    //         }
    //     });
    // }

    return {
        isValid: errors.length === 0,
        errors
    };
};