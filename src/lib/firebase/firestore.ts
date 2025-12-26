import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './config';

// ===== User Collection =====
export interface FirestoreUser {
    id: string;
    telegramId: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
    createdAt: Timestamp;
    lastActiveAt: Timestamp;
    toysOwned: string[];
}

// Create or update user from Telegram data
export async function syncTelegramUser(telegramUser: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
}): Promise<FirestoreUser> {
    const userRef = doc(db, 'users', String(telegramUser.id));
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        await updateDoc(userRef, {
            firstName: telegramUser.first_name || '',
            lastName: telegramUser.last_name || '',
            username: telegramUser.username || '',
            photoUrl: telegramUser.photo_url || '',
            lastActiveAt: serverTimestamp(),
        });
        return { ...userSnap.data(), id: userSnap.id } as FirestoreUser;
    } else {
        const newUser = {
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name || '',
            lastName: telegramUser.last_name || '',
            username: telegramUser.username || '',
            photoUrl: telegramUser.photo_url || '',
            createdAt: serverTimestamp(),
            lastActiveAt: serverTimestamp(),
            toysOwned: [],
        };
        await setDoc(userRef, newUser);
        return { ...newUser, id: String(telegramUser.id) } as unknown as FirestoreUser;
    }
}

// Get user by Telegram ID
export async function getUserByTelegramId(telegramId: number): Promise<FirestoreUser | null> {
    const userRef = doc(db, 'users', String(telegramId));
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { ...userSnap.data(), id: userSnap.id } as FirestoreUser;
    }
    return null;
}

// ===== Toys Collection =====
export interface FirestoreToy {
    id: string;
    nfcId: string;
    name: string;
    model: string;
    serialNumber: string;
    rarity: 'common' | 'rare' | 'legendary';
    tgsFile: string;
    status: 'available' | 'sold' | 'activated';
    ownerId?: string;
    activatedAt?: Timestamp;
    createdAt: Timestamp;
}

// Activate a toy
export async function activateToy(
    nfcId: string,
    ownerId: number,
    toyData: Partial<FirestoreToy>
): Promise<FirestoreToy> {
    const toyRef = doc(db, 'toys', nfcId);
    const toySnap = await getDoc(toyRef);

    if (toySnap.exists()) {
        await updateDoc(toyRef, {
            status: 'activated',
            ownerId: String(ownerId),
            activatedAt: serverTimestamp(),
        });
        return { ...toySnap.data(), id: toySnap.id } as FirestoreToy;
    } else {
        const newToy = {
            nfcId,
            name: toyData.name || 'Unknown',
            model: toyData.model || 'Series 1',
            serialNumber: toyData.serialNumber || '#001',
            rarity: toyData.rarity || 'common',
            tgsFile: toyData.tgsFile || '',
            status: 'activated',
            ownerId: String(ownerId),
            activatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        };
        await setDoc(toyRef, newToy);

        // Add to user's collection
        const userRef = doc(db, 'users', String(ownerId));
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            await updateDoc(userRef, {
                toysOwned: [...(userData.toysOwned || []), nfcId],
            });
        }

        return { ...newToy, id: nfcId } as unknown as FirestoreToy;
    }
}

// Get toys owned by user
export async function getUserToys(userId: number): Promise<FirestoreToy[]> {
    const toysRef = collection(db, 'toys');
    const q = query(toysRef, where('ownerId', '==', String(userId)));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
    } as FirestoreToy));
}

// Check if toy is already activated
export async function isToyActivated(nfcId: string): Promise<boolean> {
    const toyRef = doc(db, 'toys', nfcId);
    const toySnap = await getDoc(toyRef);

    if (toySnap.exists()) {
        return toySnap.data().status === 'activated';
    }
    return false;
}

// ===== QR Codes Collection =====
export interface FirestoreQRCode {
    id: string;
    nfcId: string;
    modelName: string;
    serialNumber: string;
    rarity: 'common' | 'rare' | 'legendary';
    tgsFile: string;
    token: string;
    status: 'created' | 'used';
    createdAt: Timestamp;
    usedAt?: Timestamp;
    usedBy?: string;
}

// Create a new QR code
export async function createQRCode(data: {
    modelName: string;
    serialNumber: string;
    rarity: 'common' | 'rare' | 'legendary';
    tgsFile: string;
    token: string;
}): Promise<FirestoreQRCode> {
    const nfcId = `nfc_${data.modelName.toLowerCase().replace(/\s/g, '_')}_${data.serialNumber}`;
    const qrRef = doc(db, 'qrcodes', nfcId);

    const newQR = {
        nfcId,
        modelName: data.modelName,
        serialNumber: data.serialNumber,
        rarity: data.rarity,
        tgsFile: data.tgsFile,
        token: data.token,
        status: 'created',
        createdAt: serverTimestamp(),
    };

    await setDoc(qrRef, newQR);
    return { ...newQR, id: nfcId } as unknown as FirestoreQRCode;
}

// Get all QR codes
export async function getAllQRCodes(): Promise<FirestoreQRCode[]> {
    const qrRef = collection(db, 'qrcodes');
    const querySnapshot = await getDocs(qrRef);

    return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
    } as FirestoreQRCode));
}

// Get QR code stats
export async function getQRCodeStats(): Promise<{ total: number; used: number; created: number }> {
    const qrRef = collection(db, 'qrcodes');
    const querySnapshot = await getDocs(qrRef);

    let used = 0;
    let created = 0;

    querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'used') used++;
        else created++;
    });

    return { total: querySnapshot.size, used, created };
}

// Mark QR code as used
export async function markQRCodeUsed(nfcId: string, userId: string): Promise<void> {
    const qrRef = doc(db, 'qrcodes', nfcId);
    await updateDoc(qrRef, {
        status: 'used',
        usedAt: serverTimestamp(),
        usedBy: userId,
    });
}

// Check if QR code exists
export async function getQRCode(nfcId: string): Promise<FirestoreQRCode | null> {
    const qrRef = doc(db, 'qrcodes', nfcId);
    const qrSnap = await getDoc(qrRef);

    if (qrSnap.exists()) {
        return { ...qrSnap.data(), id: qrSnap.id } as FirestoreQRCode;
    }
    return null;
}
