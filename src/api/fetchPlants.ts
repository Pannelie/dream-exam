// import axios from "axios";
import type { iPlant, iPlantExtraInfo } from "../interfaces/index.js";

export const apiKey: string = "sk-KhLU6911aabb6e3e813338";

export const fetchAllMaples = async (): Promise<iPlant[] | []> => {
  const allMaplesUrl: string = `https://perenual.com/api/species-list?key=${apiKey}&page=2`;

  try {
    const response: Response = await fetch(allMaplesUrl);

    if (response.ok) {
      const data: { data: iPlant[] } = await response.json();
      console.log("data from all maples: ", data);
      return data.data;
    } else {
      throw new Error("Det var inte lön(nt) att hitta någon lönn idag");
    }
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const fetchMapleDetails = async (id: number): Promise<iPlantExtraInfo | null> => {
  const singleMapleUrl: string = `https://perenual.com/api/v2/species/details/${id}?key=${apiKey}`;
  try {
    const response = await fetch(singleMapleUrl);
    if (response.ok) {
      const data: iPlantExtraInfo = await response.json();
      console.log("data from mapledetails: ", data);
      return data;
    } else {
      console.log("HTTP status:", response.status);
      throw new Error("Det var inte lön(nt) att hitta din lönn idag");
    }
  } catch (error) {}
  console.error("Fel i fetchMapleDetails:", Error);
  return null;
};
