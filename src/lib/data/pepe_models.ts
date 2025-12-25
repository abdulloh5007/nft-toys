export interface PepeModel {
    name: string;
    chance: number; // Percentage (e.g., 1 for 1%)
    rarity: 'common' | 'rare' | 'legendary';
}

export const PEPE_MODELS: PepeModel[] = [
    // 1% - Legendary
    { name: 'Raphael', chance: 1, rarity: 'legendary' },
    { name: 'Ninja Mike', chance: 1, rarity: 'legendary' },
    { name: 'Fifty Shades', chance: 1, rarity: 'legendary' },
    { name: 'Toading...', chance: 1, rarity: 'legendary' },
    { name: 'Midas Pepe', chance: 1, rarity: 'legendary' },
    { name: 'Leonardo', chance: 1, rarity: 'legendary' },
    { name: 'Donatello', chance: 1, rarity: 'legendary' },
    { name: 'Cozy Galaxy', chance: 1, rarity: 'legendary' },
    { name: 'Gucci Leap', chance: 1, rarity: 'legendary' },
    { name: 'Steel Frog', chance: 1, rarity: 'legendary' },
    { name: 'Magnate', chance: 1, rarity: 'legendary' },
    { name: 'Emerald Plush', chance: 1, rarity: 'legendary' },
    { name: 'Louis Vuittoad', chance: 1, rarity: 'legendary' },
    { name: 'Puppy Pug', chance: 1, rarity: 'legendary' },

    // 2% - Rare
    { name: 'Bavaria', chance: 2, rarity: 'rare' },
    { name: 'Red Pepple', chance: 2, rarity: 'rare' },
    { name: 'Pink Galaxy', chance: 2, rarity: 'rare' },
    { name: 'Milano', chance: 2, rarity: 'rare' },
    { name: 'Yellow Purp', chance: 2, rarity: 'rare' },
    { name: 'X-Ray', chance: 2, rarity: 'rare' },
    { name: 'Sketchy', chance: 2, rarity: 'rare' },
    { name: 'Marble', chance: 2, rarity: 'rare' },
    { name: 'Birmingham', chance: 2, rarity: 'rare' },
    { name: 'Barcelona', chance: 2, rarity: 'rare' },
    { name: 'Sunset', chance: 2, rarity: 'rare' },
    { name: 'Emo Boi', chance: 2, rarity: 'rare' },
    { name: 'Santa Pepe', chance: 2, rarity: 'rare' },
    { name: 'Kung Fu Pepe', chance: 2, rarity: 'rare' },
    { name: 'Christmas', chance: 2, rarity: 'rare' },
    { name: 'Amalgam', chance: 2, rarity: 'rare' },
    { name: 'Stripes', chance: 2, rarity: 'rare' },
    { name: 'Pink Latex', chance: 2, rarity: 'rare' },
    { name: 'Two Face', chance: 2, rarity: 'rare' },
    { name: 'Frozen', chance: 2, rarity: 'rare' },
    { name: 'Princess', chance: 2, rarity: 'rare' },
    { name: 'Pepe La Rana', chance: 2, rarity: 'rare' },

    // 3% - Common
    { name: 'Spectrum', chance: 3, rarity: 'common' },
    { name: 'Polka Dots', chance: 3, rarity: 'common' },
    { name: 'Yellow Hug', chance: 3, rarity: 'common' },
    { name: 'Hothead', chance: 3, rarity: 'common' },
    { name: 'Gummy Frog', chance: 3, rarity: 'common' },
    { name: 'Red Menace', chance: 3, rarity: 'common' },
    { name: 'Tropical', chance: 3, rarity: 'common' },
    { name: 'Poison Dart', chance: 3, rarity: 'common' },
    { name: 'Eggplant', chance: 3, rarity: 'common' },
    { name: 'Pepemint', chance: 3, rarity: 'common' },
    { name: 'Hue Jester', chance: 3, rarity: 'common' },
    { name: 'Cold Heart', chance: 3, rarity: 'common' },
    { name: 'Aqua Plush', chance: 3, rarity: 'common' },
    { name: 'Pumpkin', chance: 3, rarity: 'common' },
];
