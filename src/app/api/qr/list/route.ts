import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function GET(request: NextRequest) {
    try {
        const qrRef = collection(db, 'qrcodes');
        const q = query(qrRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const qrCodes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                nfcId: data.nfcId,
                modelName: data.modelName,
                serialNumber: data.serialNumber,
                rarity: data.rarity,
                status: data.status,
                token: data.token,
                createdAt: data.createdAt?.seconds
                    ? new Date(data.createdAt.seconds * 1000).toISOString()
                    : null,
                usedAt: data.usedAt?.seconds
                    ? new Date(data.usedAt.seconds * 1000).toISOString()
                    : null,
                usedBy: data.usedBy,
            };
        });

        // Calculate stats
        let used = 0;
        let created = 0;

        qrCodes.forEach(qr => {
            if (qr.status === 'used') used++;
            else created++;
        });

        return NextResponse.json({
            qrCodes,
            stats: {
                total: qrCodes.length,
                used,
                created,
            }
        });

    } catch (error) {
        console.error('Error getting QR list:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
