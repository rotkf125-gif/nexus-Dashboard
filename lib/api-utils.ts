import { NextResponse } from 'next/server';

export class APIError extends Error {
    constructor(
        public status: number,
        message: string,
        public code: string = 'INTERNAL_ERROR'
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export function createErrorResponse(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof APIError) {
        return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status }
        );
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        return NextResponse.json(
            { error: error.message, code: 'INTERNAL_SERVER_ERROR' },
            { status: 500 }
        );
    }

    // Handle unknown errors
    return NextResponse.json(
        { error: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' },
        { status: 500 }
    );
}
