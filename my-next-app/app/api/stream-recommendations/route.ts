import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();
        const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";

        const response = await fetch(`${backendUrl}/api/recommend/query/stream/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, top_k: 5 }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Streaming backend error (${response.status}):`, errorText);
            return NextResponse.json({ error: `Backend returned ${response.status}: ${errorText}` }, { status: response.status });
        }

        // Return the stream directly to the client
        return new Response(response.body, {
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Streaming error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
