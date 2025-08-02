import { cloudinary } from "./config.js";

/**
 * Extract public_id from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string|null} - Public ID or null if extraction fails
 */
function extractPublicIdFromUrl(cloudinaryUrl) {
    try {
        // Cloudinary URL pattern: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
        const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
        const match = cloudinaryUrl.match(regex);
        
        if (match && match[1]) {
            // For files in folders, the public_id includes the folder path
            return match[1];
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting public_id from URL:', error);
        return null;
    }
}

/**
 * Delete a file from Cloudinary
 * @param {string} cloudinaryUrl - Full Cloudinary URL of the file to delete
 * @returns {Promise<boolean>} - True if deletion was successful, false otherwise
 */
export default async function deleteUserChatFileFromCloudinary(cloudinaryUrl) {
    try {
        if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
            console.log('Invalid Cloudinary URL provided for deletion');
            return false;
        }

        // Check if it's actually a Cloudinary URL
        if (!cloudinaryUrl.includes('res.cloudinary.com')) {
            console.log('URL is not a Cloudinary URL, skipping deletion');
            return false;
        }

        const publicId = extractPublicIdFromUrl(cloudinaryUrl);
        
        if (!publicId) {
            console.error('Could not extract public_id from URL:', cloudinaryUrl);
            return false;
        }

        console.log('Attempting to delete file with public_id:', publicId);

        // Determine resource type based on file extension or URL
        let resourceType = 'auto'; // Default to auto-detect
        if (cloudinaryUrl.includes('/video/upload/')) {
            resourceType = 'video';
        } else if (cloudinaryUrl.includes('/image/upload/')) {
            resourceType = 'image';
        } else if (cloudinaryUrl.includes('/raw/upload/')) {
            resourceType = 'raw';
        }

        console.log('Using resource_type:', resourceType);

        // Delete the file from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        console.log('Cloudinary deletion result:', result);

        if (result.result === 'ok') {
            console.log('File deleted successfully from Cloudinary:', publicId);
            return true;
        } else if (result.result === 'not found') {
            console.log('File not found in Cloudinary (may have been already deleted):', publicId);
            return true; // Consider it successful since the file doesn't exist
        } else {
            console.error('Failed to delete file from Cloudinary:', result);
            return false;
        }

    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
    }
}

/**
 * Check if a message content contains a Cloudinary URL
 * @param {string} content - Message content to check
 * @returns {boolean} - True if content contains Cloudinary URL
 */
export function isCloudinaryUrl(content) {
    if (!content || typeof content !== 'string') {
        return false;
    }
    
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\/]+\/[^\/]+\/upload\/[^\s]+/;
    return cloudinaryRegex.test(content);
}

/**
 * Extract Cloudinary URL from message content
 * @param {string} content - Message content
 * @returns {string|null} - Cloudinary URL or null if not found
 */
export function extractCloudinaryUrl(content) {
    if (!content || typeof content !== 'string') {
        return null;
    }
    
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\/]+\/[^\/]+\/upload\/[^\s]+/;
    const match = content.match(cloudinaryRegex);
    
    return match ? match[0] : null;
}

/**
 * Cleanup function to delete multiple files from Cloudinary
 * This can be used for batch operations or cleanup scripts
 * @param {string[]} cloudinaryUrls - Array of Cloudinary URLs to delete
 * @returns {Promise<{successful: number, failed: number, results: Array}>}
 */
export async function deleteMultipleFiles(cloudinaryUrls) {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const url of cloudinaryUrls) {
        try {
            const success = await deleteUserChatFileFromCloudinary(url);
            results.push({ url, success });
            
            if (success) {
                successful++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`Error deleting file ${url}:`, error);
            results.push({ url, success: false, error: error.message });
            failed++;
        }
    }

    return {
        successful,
        failed,
        total: cloudinaryUrls.length,
        results
    };
}
