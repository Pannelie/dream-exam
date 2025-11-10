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
  const gameStartPageRef = document.querySelector("#gameStartPage") as HTMLElement;
  const playPageRef = document.querySelector("#playPage") as HTMLElement;
  const gameResultMsg = document.querySelector("#gameResultMsg") as HTMLElement;
  const gameTitle = document.querySelector("#gameTitle") as HTMLElement;
  const startBtn = document.querySelector<HTMLButtonElement>("#startGameBtn")!;

  switch (section) {
    case "study":
      studyPageRef.classList.remove("d-none");
      gameStartPageRef.classList.add("d-none");
      playPageRef.classList.add("d-none");
      break;
    case "play":
      gameStartPageRef.classList.remove("d-none");
      gameTitle.innerText = "Välkommen till Lönn-quiz!";
      startBtn.innerText = "Starta spelet";
      studyPageRef.classList.add("d-none");
      playPageRef.classList.add("d-none");
      gameResultMsg.innerText = "";
      gameResultMsg.classList.add(".d-none");
      break;
    default:
      console.log("Något gick fel");
  }
};

const quizStartSetup = (): void => {
  const startBtn = document.querySelector<HTMLButtonElement>("#startGameBtn")!;
  const gameStartPage = document.querySelector("#gameStartPage")!;
  const playPage = document.querySelector("#playPage")!;
  const gameResultMsg = document.querySelector("#gameResultMsg")!;

  if (!startBtn) return;

  startBtn.addEventListener("click", () => {
    // Dölj startskärmen
    gameStartPage.classList.add("d-none");

    // Visa spel-sidan
    playPage.classList.remove("d-none");

    // Starta quiz
    if (maplesGlobal.length) renderQuizMaples(maplesGlobal);

    // Nollställ gameResultMsg
    gameResultMsg.classList.add("d-none");
  });
};

// fick hjälp av chatGpt, gjorde för många snabba anrop
// och fick inte lov att ändra API längre vid ett tillfälle
const maplesSetup = async (): Promise<void> => {
  // Kolla om vi redan har data i localStorage
  const cachedMaples = localStorage.getItem("maplesData");
  if (cachedMaples) {
    console.log("Hämtar maples från localStorage");
    maplesGlobal = JSON.parse(cachedMaples) as iPlantExtraInfo[];
    renderStudyMaples(maplesGlobal);
    return;
  }

  // Om ingen cache finns, hämta från API
  const maplesBasicList = await fetchAllMaples();

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
      await delay(200); // delay mellan requests
    } catch (error) {
      console.error("Fel vid hämtning av lönn:", error);
    }
  }

  // Spara den hämtade datan i localStorage
  localStorage.setItem("maplesData", JSON.stringify(maples));

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
      const gameStartPage = document.querySelector("#gameStartPage") as HTMLElement;
      const gameResultMsg = document.querySelector("#gameResultMsg") as HTMLElement;
      const gameTitle = document.querySelector("#gameTitle") as HTMLElement;
      const startGameBtn = document.querySelector("#startGameBtn") as HTMLElement;

      playPage.classList.add("d-none");
      gameStartPage.classList.remove("d-none");
      gameResultMsg.classList.remove("d-none");
      startGameBtn.innerText = "Spela igen?";

      if (score === totalQuestions) {
        console.log(`Det lönnar sig att studera, full pott med ${score} poäng`);
        gameTitle.innerText = "Stort Grattis!";
        gameResultMsg.innerText = `Det lönnar sig att studera, full pott!\n\n ${score} / ${totalQuestions} poäng`;
      } else if (score === 0) {
        console.log(`Lönn som lönn, eller? Tyvärr ${score} poäng. försök igen!`);
        gameTitle.innerText = "Ajdå...";
        gameResultMsg.innerText = `Lönn som lönn, eller?\n\n ${score} / ${totalQuestions} poäng`;
      } else {
        console.log(`Du fick lönn för mödan! ${score} poäng!`);
        gameTitle.innerText = "Bra kämpat!";
        gameResultMsg.innerText = `Du fick lönn för mödan!\n\n ${score} / ${totalQuestions} poäng`;
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
  quizStartSetup();
  await maplesSetup();
});
