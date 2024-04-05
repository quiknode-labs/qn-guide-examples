import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const API_KEY = process.env.QN_IPFS_API;
    const API_ENDPOINT = "https://api.quicknode.com/ipfs/rest/v1/s3/put-object";

    try {
        if (!API_KEY) {
            throw new Error('API key not set');
        }
/*         const formData = await request.formData();

        const myHeaders = new Headers();
        myHeaders.append("x-api-key", API_KEY);

        const requestOptions: RequestInit = {
            method: 'POST',
            headers: myHeaders,
            body: formData,
        };
        const result = await fetch(API_ENDPOINT, requestOptions);
        if (!result.ok) {
            throw new Error(`API call failed with status ${result.status}: ${await result.text()}`);
        }

        const response = await result.json(); */
        
        // Temporary mock response for quick iterations w/o making actual API call
        const mockResponse = {
            "requestid": "some-request-id",
            "status": "pinned",
            "created": "2024-04-04T15:21:18.000-04:00",
            "pin": {
                "cid": "QmdCkrrTySp7KMboaYrrrvuZ8fii7hCt5mtAKfu5TRfL89",
                "name": "metadata.json",
                "origins": [],
                "meta": {}
            },
            "info": {
                "size": "187515"
            },
            "delegates": [
                "example1",
                "example2",
                "example3"
            ]
        };
        return new Response(JSON.stringify({ response: mockResponse }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        console.error("Error in POST function:", error instanceof Error ? error.message : error);
        return new Response(JSON.stringify({ error: 'An error occurred while processing your request. Please try again later.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
}
