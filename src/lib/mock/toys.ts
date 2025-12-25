import { PEPE_MODELS, PepeModel } from '@/lib/data/pepe_models';

export interface Toy {
    id: string;
    name: string;
    model: string;
    rarity: 'common' | 'rare' | 'legendary';
    price: number; // in TON or Stars (mock currency unit)
    imageUrl: string;
    tgsUrl?: string; // Path to animated sticker
    status: 'available' | 'sold' | 'activated';
    ownerId?: number;
    nfcId?: string;
    rarityChance: number;
}

// Pricing rules based on rarity (in UZS)
const getPrice = (rarity: string) => {
    switch (rarity) {
        case 'legendary': return 2500000;
        case 'rare': return 650000;
        case 'common': return 199000;
        default: return 50000;
    }
};

const getTgsPath = (name: string) => {
    // Convert "Ninja Mike" -> "ninja_mike.tgs"
    // "Gucci Leap" -> "gucci leap.tgs" (based on file list, some have spaces)
    // "Bavaria" -> "bavariya.tgs" (manual fix might be needed if mismatch)

    const cleanName = name.toLowerCase();

    // Map specific mismatches if any, otherwise default rule
    const overrides: Record<string, string> = {
        'bavaria': 'bavariya.tgs',
        'gucci leap': 'gucci leap.tgs' // The file has a space
    };

    if (overrides[cleanName]) return `/models/${overrides[cleanName]}`;
    return `/models/${cleanName.replace(/\s+/g, '_')}.tgs`;
};

// Generate a curated list for the store
const generateStoreInventory = (): Toy[] => {
    // Select specific interesting models to showcase
    const showcaseModels = [
        'Raphael', 'Ninja Mike', 'Midas Pepe', 'Gucci Leap', // Legendary
        'Bavaria', 'Red Pepple', 'Pink Galaxy', 'X-Ray', // Rare
        'Spectrum', 'Polka Dots', 'Yellow Hug', 'Pumpkin' // Common
    ];

    return showcaseModels.map((name, index) => {
        const modelData = PEPE_MODELS.find(m => m.name === name);
        if (!modelData) return null;

        // Generate a deterministic serial number based on index to avoid hydration mismatch
        const serialNum = ((index * 17 + 23) % 100) + 1;
        const serialStr = `#${serialNum.toString().padStart(3, '0')}`;

        return {
            id: `toy_${index + 1}`,
            name: modelData.name,
            model: `Series 1`, // Series Name
            serialNumber: serialStr, // Unique Serial
            rarity: modelData.rarity,
            price: getPrice(modelData.rarity),
            imageUrl: `/toys/pepe_default.png`, // Generic placeholder for now
            tgsUrl: getTgsPath(name),
            status: 'available',
            nfcId: `nfc_${name.toLowerCase().replace(/\s/g, '_')}`, // predictable NFC ID for testing
            rarityChance: modelData.chance,
        };
    }).filter(Boolean) as Toy[];
};

export const mockToys: Toy[] = generateStoreInventory();