const API_KEY = "live_kcA44BoDNxeoPTS7CrwvIDl99E0VnLNlXuZQjrJYkVgQs4lNNj29EkURiW8JiQUo";
// --- 1. Hämta raser ---
async function fetchBreeds(limit = 5, page = 0) {
    const res = await fetch(`https://api.thedogapi.com/v1/breeds?limit=${limit}&page=${page}`, {
        headers: { "x-api-key": API_KEY },
    });
    if (!res.ok)
        throw new Error(`Fel vid API-anrop: ${res.status}`);
    const data = await res.json();
    return data;
}
// --- 2. Hämta bilder per ras ---
async function fetchImagesForBreeds(breeds) {
    return Promise.all(breeds.map(async (breed) => {
        try {
            const res = await fetch(`https://api.thedogapi.com/v1/images/search?breed_id=${breed.id}&limit=1`, {
                headers: { "x-api-key": API_KEY },
            });
            if (!res.ok)
                throw new Error(`Fel vid bild-anrop: ${res.status}`);
            const data = await res.json();
            return { breedId: breed.id, imageUrl: data[0]?.url || null };
        }
        catch (err) {
            console.error(`Kunde inte hämta bild för ${breed.name}:`, err.message);
            return { breedId: breed.id, imageUrl: null };
        }
    }));
}
// --- 3. Koppla bilder till raser ---
async function fetchBreedsWithImages(limit = 5, page = 0) {
    const breeds = await fetchBreeds(limit, page);
    const images = await fetchImagesForBreeds(breeds);
    return breeds.map((breed) => ({
        ...breed,
        image: images.find((img) => img.breedId === breed.id)?.imageUrl || null,
    }));
}
export {};
//# sourceMappingURL=fetchDogs.js.map