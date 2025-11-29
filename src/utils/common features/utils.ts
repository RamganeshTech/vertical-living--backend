import axios from 'axios'; // You likely already have this, or use fetch

import crypto from "crypto";

/**
 * Get the name field based on model type
 */
export function getNameFieldByModel(modelName: string): string {
  const nameFieldMap: Record<string, string> = {
    'StaffModel': 'staffName',
    'UserModel': 'username',
    'WorkerModel': 'workerName',
    'CTOModel': 'CTOName',
    'ClientModel': "clientName"
  };
  
  return nameFieldMap[modelName] || 'name';
}


export function getModelNameByRole(role: string): string {
  const nameFieldMap: Record<string, string> = {
    "staff": 'StaffModel',
    "owner": 'UserModel',
    "worker":'WorkerModel',
    "CTO": 'CTOModel',
    "client": "ClientModel"
  };
  
  return nameFieldMap[role] || 'staffModel';
}




/**
 * Extracts Latitude and Longitude from various Google Maps URL formats
 */


export const getCoordinatesFromGoogleMapUrl = async (url: string): Promise<{ lat: number | null, lng: number | null }> => {
    try {
        if (!url) return { lat: null, lng: null };

        // 1. Prepare Headers to mimic a real browser (Critical for Google)
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        };

        let finalUrl = url;
        let htmlContent = '';

        // 2. Fetch the page
        // We treat goo.gl links specifically to follow redirects
        if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
            try {
                const response = await axios.get(url, {
                    headers,
                    maxRedirects: 10,
                    validateStatus: (status) => status >= 200 && status < 400
                });
                
                finalUrl = response.request.res.responseUrl || url;
                htmlContent = response.data; // Save HTML for fallback check
            } catch (err:any) {
                console.log("Error fetching URL, will try regex on original string", err.message);
            }
        }

        console.log("Debug - Final URL:", finalUrl);

        // --- STRATEGY 1: Check the URL Bar first ---
        let coords = extractCoordsFromText(finalUrl);
        if (coords.lat && coords.lng) return coords;

        // --- STRATEGY 2: Check OpenGraph URL in HTML ---
        // Google often puts the clean URL in <meta property="og:url" content="...">
        const ogUrlMatch = htmlContent.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
        if (ogUrlMatch && ogUrlMatch[1]) {
            console.log("Debug - Found OG URL:", ogUrlMatch[1]);
            coords = extractCoordsFromText(ogUrlMatch[1]);
            if (coords.lat && coords.lng) return coords;
        }

        // --- STRATEGY 3: Check Static Map Image in HTML ---
        // Google puts a static map image for previews: <meta property="og:image" content=".../staticmap?center=25.2,55.3...">
        const ogImageMatch = htmlContent.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (ogImageMatch && ogImageMatch[1]) {
            console.log("Debug - Found OG Image:", ogImageMatch[1]);
            // Look for 'center=' or 'markers=' in the image URL
            // Decode URI component just in case
            const decodedImgUrl = decodeURIComponent(ogImageMatch[1]);
            
            // Pattern: center=25.123,55.123
            const centerMatch = decodedImgUrl.match(/center=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (centerMatch) {
                return { lat: parseFloat(centerMatch[1]), lng: parseFloat(centerMatch[2]) };
            }
            
            // Pattern: markers=25.123,55.123
            const markerMatch = decodedImgUrl.match(/markers=([^&]+)/);
            if (markerMatch) {
                 const parts = markerMatch[1].split('|')[0].split(','); // Handle multiple markers
                 // Sometimes markers are labeled "color:red|25.123,55.123"
                 const lastPart = parts[parts.length - 1]; // usually the lat is near the end if mixed
                 // Cleaner regex for the lat,lng part inside markers
                 const latLng = markerMatch[1].match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
                 if(latLng) {
                     return { lat: parseFloat(latLng[1]), lng: parseFloat(latLng[2]) };
                 }
            }
        }

        return { lat: null, lng: null };

    } catch (error) {
        console.error("Error extracting map coordinates:", error);
        return { lat: null, lng: null };
    }
};

// Helper function to run Regex against any string (URL or Meta content)
const extractCoordsFromText = (text: string) => {
    // 1. Standard @lat,lng
    const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    // 2. Query Param ?q=lat,lng
    const qMatch = text.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    
    // 3. Query Param ?ll=lat,lng
    const llMatch = text.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

    // 4. Embed params !3d...!4d...
    const dataMatchLat = text.match(/!3d(-?\d+\.\d+)/);
    const dataMatchLng = text.match(/!4d(-?\d+\.\d+)/);
    if (dataMatchLat && dataMatchLng) {
        return { lat: parseFloat(dataMatchLat[1]), lng: parseFloat(dataMatchLng[1]) };
    }

    return { lat: null, lng: null };
}







const ALGO = "aes-256-cbc";

// 32-byte hardcoded encryption key
const SECRET = "supersecurekeysupersecurekey"; // EXACTLY 32 chars

export const encryptCryptoToken = (payload: object) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(SECRET), iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);

  return iv.toString("base64") + ":" + encrypted.toString("base64");
};

export const decryptCryptoToken = (token: string) => {
  const [ivStr, encryptedData] = token.split(":");
  const iv = Buffer.from(ivStr, "base64");
  const encryptedBuffer = Buffer.from(encryptedData, "base64");

  const decipher = crypto.createDecipheriv(ALGO, Buffer.from(SECRET), iv);

  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8"));
};