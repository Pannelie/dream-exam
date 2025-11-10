import { fetchAllMaples, fetchMapleDetails } from "./api/fetchPlants.js";
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
let maplesGlobal = [];
const pageSetup = () => {
    const pageRefs = document.querySelectorAll(".page");
    pageRefs.forEach((page) => page.classList.add("d-none"));
};
const navSetup = () => {
    const navItemRefs = document.querySelectorAll(".header__nav-item");
    navItemRefs.forEach((navItem) => {
        navItem.addEventListener("click", (e) => {
            console.log(e.target.dataset.id);
            toggleSectionDisplay(e.target.dataset.id);
        });
    });
};
const toggleSectionDisplay = (section) => {
    const studyPageRef = document.querySelector("#studyPage");
    const playPageRef = document.querySelector("#playPage");
    switch (section) {
        case "study":
            studyPageRef.classList.remove("d-none");
            if (!playPageRef.classList.contains("d-none")) {
                playPageRef.classList.add("d-none");
            }
            break;
        case "play":
            const winningMsg = document.querySelector("#winningMsg");
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
const maplesSetup = async () => {
    // const maplesBasicList = await fetchAllMaples();
    const maplesBasicList = (await fetchAllMaples()).slice(0, 5);
    console.log("maplesBasicList: ", maplesBasicList);
    if (!maplesBasicList || !Array.isArray(maplesBasicList)) {
        console.error("Fel! fetchAllMaples returnerade inget eller fel format.");
        return;
    }
    console.log("antal maples:", maplesBasicList.length);
    const maples = [];
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
        }
        catch (error) {
            const err = error;
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
const renderStudyMaples = (maples) => {
    const plantsSection = document.querySelector("#plantsSection");
    maples.forEach((maple) => {
        const cardRef = createMapleCard(maple);
        plantsSection?.appendChild(cardRef);
    });
};
const createMapleCard = (maple) => {
    const cardRef = document.createElement("article");
    cardRef.classList.add("study-plant");
    const cardTemplate = `
    <img src="${maple.default_image.regular_url}" alt="${maple.common_name}" class="study-plant__img"/>
    <h2 class="study-plant__title">Namn: ${maple.common_name}</h2>
    <p class="study-plant__info">Vetenskapligt namn: ${maple.scientific_name[0]}</p>
    <p class="study-plant__info">Vetenskapligt namn: ${maple.description}</p>
  `;
    cardRef.innerHTML = cardTemplate;
    return cardRef;
};
const renderQuizMaples = (plants) => {
    const playPage = document.querySelector("#playPage");
    const playSection = playPage.querySelector("#playPlantSection");
    const imgEl = playPage.querySelector(".play__img");
    const questionEl = playPage.querySelector(".play__question");
    const btnsSection = document.querySelector(".play__btn-section");
    const btns = btnsSection.querySelectorAll(".play__btn");
    let currentPlant;
    let currentQuestion = 1;
    let totalQuestions = 5;
    let score = 0;
    function getRandomFour(plants) {
        const shuffled = [...plants].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }
    function newQuestion() {
        if (plants.length === 0)
            return;
        if (currentQuestion > totalQuestions) {
            playSection.classList.add("d-none");
            const playMsg = document.querySelector("#playMsg");
            playMsg.classList.remove("d-none");
            if (score === totalQuestions) {
                console.log(`Det lönnar sig att studera, full pott med ${score} poäng`);
                playMsg.innerText = `Det lönnar sig att studera, full pott!\n\n ${score} / ${totalQuestions} poäng`;
            }
            else if (score === 0) {
                console.log(`Lönn som lönn, eller? Tyvärr ${score} poäng. försök igen!`);
                playMsg.innerText = `Lönn som lönn, eller?\n\n ${score} / ${totalQuestions} poäng`;
            }
            else {
                console.log(`Du fick lönn för mödan! ${score} poäng!`);
                playMsg.innerText = `Du fick lönn för mödan!\n\n ${score} / ${totalQuestions} poäng`;
            }
            currentQuestion = 1;
            score = 0;
            return;
        }
        const options = getRandomFour(plants);
        if (options.length === 0)
            return;
        const randomIndex = Math.floor(Math.random() * options.length);
        currentPlant = options[randomIndex];
        imgEl.src = currentPlant.default_image.regular_url ?? "";
        imgEl.alt = currentPlant.common_name;
        questionEl.textContent = "Vad är det här för lönn?";
        options.forEach((plant, index) => {
            const btn = btns[index];
            if (!btn)
                return;
            btn.textContent = plant.common_name;
            btn.onclick = () => checkAnswer(plant.common_name);
        });
    }
    function checkAnswer(selected) {
        if (selected === currentPlant.common_name) {
            score++;
            console.log("rätt");
        }
        else {
            console.log(`Fel! Rätt svar var: ${currentPlant.common_name}`);
        }
        currentQuestion++;
        newQuestion();
    }
    newQuestion();
};
document.addEventListener("DOMContentLoaded", async () => {
    pageSetup();
    navSetup();
    await maplesSetup();
});
//# sourceMappingURL=index.js.map