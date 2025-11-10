//Inser att översättning inte var så lätt som jag trodde
// utan att riskera betalning.
// Så lät engelska blandat med svenska vara kvar,
import { fetchAllMaples, fetchMapleDetails } from "./api/fetchPlants.js";
let maplesGlobal = [];
let totalNrQuestions = 5;
const navSetup = () => {
    const navItemRefs = document.querySelectorAll(".header__nav-item");
    navItemRefs.forEach((navItem) => {
        navItem.addEventListener("click", (e) => {
            const target = e.target;
            const sectionId = target.dataset.id;
            console.log(sectionId);
            toggleSectionDisplay(e.target.dataset.id);
        });
    });
};
// ------------bestämmer vad som ska visas beroende på toggle ------------
const toggleSectionDisplay = (section) => {
    const studyPageRef = document.querySelector("#studyPage");
    const gameStartPageRef = document.querySelector("#gameStartPage");
    const playPageRef = document.querySelector("#playPage");
    const gameResultMsg = document.querySelector("#gameResultMsg");
    const gameTitle = document.querySelector("#gameTitle");
    const startBtn = document.querySelector("#startGameBtn");
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
            gameResultMsg.innerText = `Du kommer få ${totalNrQuestions} frågor med tillhörande bild och fyra svarsalternativ. Ditt mål är att matcha rätt bild med rätt namn. \n\n\nLönn, lönnare, lönnast! \nLycka till!`;
            break;
        default:
            console.log("Något gick fel");
    }
};
// ------------Hur min start av quix ska se ut visuellt------------------
const quizStartSetup = () => {
    const startBtn = document.querySelector("#startGameBtn");
    const gameStartPage = document.querySelector("#gameStartPage");
    const playPage = document.querySelector("#playPage");
    if (!startBtn)
        return;
    startBtn.addEventListener("click", () => {
        gameStartPage.classList.add("d-none");
        playPage.classList.remove("d-none");
        if (maplesGlobal.length)
            renderQuizMaples(maplesGlobal);
    });
};
//---------------- Kolla om det redan finns lönn - data i localStorage---------------------
const maplesSetup = async () => {
    const cachedMaples = localStorage.getItem("maplesData");
    if (cachedMaples) {
        console.log("Hämtar maples från localStorage");
        maplesGlobal = JSON.parse(cachedMaples);
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
    const maples = [];
    for (const maple of maplesBasicList) {
        try {
            const mapleDetails = await fetchMapleDetails(maple.id);
            if (!mapleDetails || !mapleDetails.common_name || !mapleDetails.default_image) {
                console.log(`Hoppar över lönn med id ${maple.id} eftersom data saknas`);
                continue;
            }
            maples.push(mapleDetails);
        }
        catch (error) {
            console.error("Fel vid hämtning av lönn:", error);
        }
    }
    // Spara den hämtade datan i localStorage
    localStorage.setItem("maplesData", JSON.stringify(maples));
    maplesGlobal = maples;
    renderStudyMaples(maples);
};
//---------------------Förbereder för att mina maples ska synas--------------
const renderStudyMaples = (maples) => {
    const plantsSection = document.querySelector("#plantsSection");
    maples.forEach((maple) => {
        const cardRef = createMapleCard(maple);
        plantsSection?.appendChild(cardRef);
    });
};
//---------------------Skapar upp de enskilda maples-korten som ska visas--------------
const createMapleCard = (maple) => {
    const cardRef = document.createElement("article");
    cardRef.classList.add("study-plant");
    const cardTemplate = `
    <img src="${maple.default_image.regular_url}" alt="${maple.common_name}" class="study-plant__img"/>
    <h2 class="study-plant__title">${maple.common_name}</h2>
    <p class="study-plant__info"><span class="study-plant__info--bold">Vetenskapligt namn:</span> ${maple.scientific_name[0]}</p>
    <p class="study-plant__info"><span class="study-plant__info--bold">Beskrivning:</span> ${maple.description}</p>
  `;
    cardRef.innerHTML = cardTemplate;
    return cardRef;
};
//----------------------------Min spelplan-------------------------
const renderQuizMaples = (plants) => {
    const playPage = document.querySelector("#playPage");
    const imgEl = playPage.querySelector(".play__img");
    const questionEl = playPage.querySelector(".play__question");
    const btnsSection = document.querySelector(".play__btn-section");
    const btns = btnsSection.querySelectorAll(".play__btn");
    let currentPlant;
    let currentQuestion = 1;
    let totalQuestions = totalNrQuestions;
    let score = 0;
    function getRandomFour(plants) {
        const shuffled = [...plants].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
    }
    function newQuestion() {
        if (plants.length === 0)
            return;
        if (currentQuestion > totalQuestions) {
            const gameStartPage = document.querySelector("#gameStartPage");
            const gameResultMsg = document.querySelector("#gameResultMsg");
            const gameTitle = document.querySelector("#gameTitle");
            const startGameBtn = document.querySelector("#startGameBtn");
            playPage.classList.add("d-none");
            gameStartPage.classList.remove("d-none");
            gameResultMsg.classList.remove("d-none");
            startGameBtn.innerText = "Spela igen?";
            if (score === totalQuestions) {
                console.log(`Det lönnar sig att studera, full pott med ${score} poäng`);
                gameTitle.innerText = "Stort Grattis!";
                gameResultMsg.innerText = `Det lönnar sig att studera, full pott!\n\n ${score} / ${totalQuestions} poäng`;
            }
            else if (score === 0) {
                console.log(`Lönn som lönn, eller? Tyvärr ${score} poäng. försök igen!`);
                gameTitle.innerText = "Ajdå...";
                gameResultMsg.innerText = `Lönn som lönn, eller?\n\n ${score} / ${totalQuestions} poäng`;
            }
            else {
                console.log(`Du fick lönn för mödan! ${score} poäng!`);
                gameTitle.innerText = "Bra kämpat!";
                gameResultMsg.innerText = `Du fick lönn för mödan!\n\n ${score} / ${totalQuestions} poäng`;
            }
            currentQuestion = 1;
            score = 0;
            btns.forEach((btn) => {
                btn.textContent = "";
                btn.onclick = null;
            });
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
    navSetup();
    quizStartSetup();
    await maplesSetup();
});
//# sourceMappingURL=index.js.map