import { fetchAllMaples, fetchMapleDetails } from "./api/fetchPlants.js";
import type { iPlant, iPlantExtraInfo, iApiError } from "./interfaces/index.js";

const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));
let maplesGlobal: iPlantExtraInfo[] = [];

const pageSetup = (): void => {
  const pageRefs = document.querySelectorAll<HTMLElement>(".page");
  pageRefs.forEach((page) => page.classList.add("d-none"));
};

const navSetup = (): void => {
  const navItemRefs = document.querySelectorAll<HTMLElement>(".header__nav-item");
  navItemRefs.forEach((navItem) => {
    navItem.addEventListener("click", (e: PointerEvent): void => {
      console.log((e.target as HTMLElement).dataset.id);
      toggleSectionDisplay((e.target as HTMLElement).dataset.id);
    });
  });
};

const toggleSectionDisplay = (section: string | undefined): void => {
  const studyPageRef = document.querySelector("#studyPage") as HTMLElement;
  const playPageRef = document.querySelector("#playPage") as HTMLElement;

  switch (section) {
    case "study":
      studyPageRef.classList.remove("d-none");
      if (!playPageRef.classList.contains("d-none")) {
        playPageRef.classList.add("d-none");
      }
      break;
    case "play":
      const winningMsg = document.querySelector("#winningMsg") as HTMLElement;

      // Dölj vinstmeddelandet och visa play-sektionen igen
      winningMsg.classList.add("d-none");
      playPageRef.classList.remove("d-none");
      if (!studyPageRef.classList.contains("d-none")) {
        studyPageRef.classList.add("d-none");
      }
      if (maplesGlobal.length) {
        renderQuizMaples(maplesGlobal);
      }
      break;
    default:
      console.log("Något gick fel");
  }
};

// fick hjälp av chatGpt, gjorde för många snabba anrop
// och fick inte lov att ändra API längre vid ett tillfälle
const maplesSetup = async (): Promise<void> => {
  // const maplesBasicList = await fetchAllMaples();
  const maplesBasicList = (await fetchAllMaples()).slice(0, 5);

  console.log("maplesBasicList: ", maplesBasicList);
  if (!maplesBasicList || !Array.isArray(maplesBasicList)) {
    console.error("Fel! fetchAllMaples returnerade inget eller fel format.");
    return;
  }
  console.log("antal maples:", maplesBasicList.length);
  const maples: iPlantExtraInfo[] = [];

  for (const maple of maplesBasicList) {
    try {
      const mapleDetails = await fetchMapleDetails(maple.id);

      if (!mapleDetails || !mapleDetails.common_name || !mapleDetails.default_image) {
        console.log(`Hoppar över lönn med id ${maple.id} eftersom data saknas`);
        continue;
      }
      maples.push(mapleDetails);

      // Lägg in delay mellan requests, t.ex. 200 ms
      await delay(200);
    } catch (error) {
      const err = error as iApiError;
      console.log("Fel vid hämtning av lönn:", err);

      // Om det är rate limit (429) kan vi vänta och försöka igen
      if (err.status === 429) {
        const retryAfter = (err.retryAfter ?? 5) * 1000; // fallback 5 s
        console.log(`Rate limit träffad, väntar ${retryAfter / 1000} sekunder...`);
        await delay(retryAfter);
      }
    }
  }

  maplesGlobal = maples;
  renderStudyMaples(maples);
};

const renderStudyMaples = (maples: iPlantExtraInfo[]): void => {
  const plantsSection = document.querySelector("#plantsSection") as HTMLElement;
  maples.forEach((maple) => {
    const cardRef: HTMLElement = createMapleCard(maple);
    plantsSection?.appendChild(cardRef);
  });
};

const createMapleCard = (maple: iPlantExtraInfo): HTMLElement => {
  const cardRef: HTMLElement = document.createElement("article");
  cardRef.classList.add("study-plant");

  const cardTemplate: string = `
    <img src="${maple.default_image.regular_url}" alt="${maple.common_name}" class="study-plant__img"/>
    <h2 class="study-plant__title">Namn: ${maple.common_name}</h2>
    <p class="study-plant__info">Vetenskapligt namn: ${maple.scientific_name[0]}</p>
    <p class="study-plant__info">Vetenskapligt namn: ${maple.description}</p>
  `;
  cardRef.innerHTML = cardTemplate;
  return cardRef;
};

const renderQuizMaples = (plants: iPlant[]): void => {
  const playPage = document.querySelector("#playPage") as HTMLElement;
  const playSection = playPage.querySelector<HTMLImageElement>("#playPlantSection")!;
  const imgEl = playPage.querySelector<HTMLImageElement>(".play__img")!;
  const questionEl = playPage.querySelector<HTMLHeadingElement>(".play__question")!;
  const btnsSection = document.querySelector<HTMLButtonElement>(".play__btn-section")!;
  const btns = btnsSection.querySelectorAll<HTMLButtonElement>(".play__btn");

  let currentPlant: iPlant;
  let currentQuestion: number = 1;
  let totalQuestions: number = 5;
  let score: number = 0;

  function getRandomFour(plants: iPlant[]): iPlant[] {
    const shuffled = [...plants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }

  function newQuestion(): void {
    if (plants.length === 0) return;

    if (currentQuestion > totalQuestions) {
      playSection.classList.add("d-none");
      const playMsg = document.querySelector("#playMsg") as HTMLElement;
      playMsg.classList.remove("d-none");

      if (score === totalQuestions) {
        console.log(`Det lönnar sig att studera, full pott med ${score} poäng`);
        playMsg.innerText = `Det lönnar sig att studera, full pott!\n\n ${score} / ${totalQuestions} poäng`;
      } else if (score === 0) {
        console.log(`Lönn som lönn, eller? Tyvärr ${score} poäng. försök igen!`);
        playMsg.innerText = `Lönn som lönn, eller?\n\n ${score} / ${totalQuestions} poäng`;
      } else {
        console.log(`Du fick lönn för mödan! ${score} poäng!`);
        playMsg.innerText = `Du fick lönn för mödan!\n\n ${score} / ${totalQuestions} poäng`;
      }
      currentQuestion = 1;
      score = 0;
      return;
    }
    const options = getRandomFour(plants);
    if (options.length === 0) return;
    const randomIndex = Math.floor(Math.random() * options.length);
    currentPlant = options[randomIndex]!;

    imgEl.src = currentPlant.default_image.regular_url ?? "";
    imgEl.alt = currentPlant.common_name;
    questionEl.textContent = "Vad är det här för lönn?";

    options.forEach((plant, index) => {
      const btn = btns[index];
      if (!btn) return;
      btn.textContent = plant.common_name;
      btn.onclick = () => checkAnswer(plant.common_name);
    });
  }

  function checkAnswer(selected: string): void {
    if (selected === currentPlant.common_name) {
      score++;
      console.log("rätt");
    } else {
      console.log(`Fel! Rätt svar var: ${currentPlant.common_name}`);
    }
    currentQuestion++;
    newQuestion();
  }
  newQuestion();
};

document.addEventListener("DOMContentLoaded", async (): Promise<void> => {
  pageSetup();
  navSetup();
  await maplesSetup();
});
