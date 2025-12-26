import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nfcId = searchParams.get('nfcId');

        if (!nfcId) {
            return NextResponse.json(
                { error: 'nfcId is required' },
                { status: 400 }
            );
        }

        // Check if QR exists
        const qrRef = doc(db, 'qrcodes', nfcId);
        const qrSnap = await getDoc(qrRef);

        if (!qrSnap.exists()) {
            return NextResponse.json(
                { error: 'QR code not found', code: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        // Delete the QR code
        await deleteDoc(qrRef);

        return NextResponse.json({
            success: true,
            message: `QR code ${nfcId} deleted`,
        });

    } catch (error) {
        console.error('Error deleting QR:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
