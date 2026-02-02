const axios = require('axios');

/**
 * Core WhatsApp Utility for Vertical Living Backend
 * @param {string} to - Recipient phone number with country code (e.g., '919876543210')
 * @param {string} templateName - The name of the approved Meta template
 * @param {Array<string>} variables - Array of values for template placeholders {{1}}, {{2}}, etc.
 */
export const sendWhatsAppNotification = async ({ to, templateName, variables = [], buttonVariable }: { to: string, templateName: string, variables?: Array<any>, buttonVariable?: string }) => {
    try {
        const url = `https://graph.facebook.com/${process.env.WA_API_VERSION}/${process.env.WA_PHONE_NUMBER_ID}/messages`;

        // Map your simple array of strings into the format Meta requires
        const components: any[] = [
            {
                type: "body",
                parameters: variables.map((text) => ({
                    type: "text",
                    text: text,
                })),
            },
        ];


        // If a button variable is provided, add the button component
        if (buttonVariable) {
            components.push({
                type: "button",
                sub_type: "url",
                index: 0, // Most templates have only one URL button
                parameters: [
                    { type: "text", text: buttonVariable }
                ],
            });
        }


        const payload = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",

            template: {
                name: templateName,
                language: { code: "en_US" }, // Change if using other languages
                components: components,
            },
        };

        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        console.log(`[WhatsApp Success] Sent ${templateName} to ${to}. ID: ${response.data.messages[0].id}`);
        return response.data;
    } catch (error: any) {
        // Detailed error logging for backend debugging
        console.error("[WhatsApp Error]", {
            data: error.response?.data || error.message,
            recipient: to,
            template: templateName
        });
        throw error; // Throwing error so the calling function (Controller/Worker) can handle it
    }
};
