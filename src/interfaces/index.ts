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
  careLevel: string | null;
  origin: string[];
}

//tips för error enligt chatgpt, eftersom mitt api låste sig vid för många anrop,
// så att min tidsbegränsning kommer med i mitt error
export interface iApiError {
  status?: number;
  retryAfter?: number;
  message?: string;
}

export interface iDogBreed {
  id: number;
  name: string;
  temperament: string;
  life_span: string;
  origin?: string;
  image?: string | null; // url till bilden
}
