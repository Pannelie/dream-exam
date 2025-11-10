export interface iPlant {
    id: number;
    common_name: string;
    scientific_name: string[];
    default_image: iImage;
}
interface iImage {
    regular_url: string | null;
}
export interface iPlantExtraInfo extends iPlant {
    type: string | null;
    description: string | null;
    care_level: string | null;
    origin: string[];
}
export {};
//# sourceMappingURL=index.d.ts.map