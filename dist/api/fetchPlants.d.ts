import type { iPlant, iPlantExtraInfo } from "../interfaces/index.js";
export declare const apiKey: string;
export declare const fetchAllMaples: () => Promise<iPlant[] | []>;
export declare const fetchMapleDetails: (id: number) => Promise<iPlantExtraInfo | null>;
//# sourceMappingURL=fetchPlants.d.ts.map