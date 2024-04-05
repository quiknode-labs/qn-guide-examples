import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const API_KEY = process.env.QN_IPFS_API;
    const API_ENDPOINT = "https://api.quicknode.com/ipfs/rest/v1/s3/put-object";

    try {
        if (!API_KEY) {
            throw new Error('API key not set');
        }

        const myHeaders = new Headers();
        myHeaders.append("x-api-key", API_KEY);

        const formData = await request.formData();
        const requestOptions: RequestInit = {
            method: 'POST',
            headers: myHeaders,
            body: formData
        };

/*
        const result = await fetch(API_ENDPOINT, requestOptions);
        if (!result.ok) {
            throw new Error(`API call failed with status ${result.status}: ${await result.text()}`);
        }

        const response = await result.json(); 
*/

        // Temporary mock response for quick iterations w/o making actual API call
        const mockResponse = {
            "requestid": "Z2lkOi8vZmlsZWJhc2UvQXNzZXQvMTQyNzAwNzUzNQ",
            "status": "pinned",
            "created": "2024-04-04T15:21:18.000-04:00",
            "pin": {
                "cid": "QmUUbKTffTuKmwwURebdyHwJtT1izHom5U9n7XUUTLMoaA",
                "name": "6562.png",
                "origins": [],
                "meta": {}
            },
            "info": {
                "size": "187515"
            },
            "delegates": [
                "/dns4/ipfs-pin-0.vin1.filebase.io/tcp/4001/p2p/12D3KooWNvyc1NoeTF6SynHuq5exmsMs7YyE1UFp9YhsiYw2px9B",
                "/dns4/ipfs-pin-1.vin1.filebase.io/tcp/4001/p2p/12D3KooWC8RkG22G2Jp7wdBtMDxG4LLn6d3sDfqtqXBytpyNhXTM",
                "/dns4/ipfs-pin-2.vin1.filebase.io/tcp/4001/p2p/12D3KooW9x6zfqWH46VYQoFDdfPuQqoc56L359NM6pQedrSHrv6R"
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
