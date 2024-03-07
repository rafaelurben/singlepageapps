document.addEventListener("DOMContentLoaded", () => {
    const DIFFICULTY_CONFIGS = [
        {
            blockCount: 3,
            points: 1,
            minColorDiff: 150,
            maxColorDiff: null
        },
        {
            blockCount: 6,
            points: 2,
            minColorDiff: 100,
            maxColorDiff: 350
        },
        {
            blockCount: 6,
            points: 3,
            minColorDiff: 100,
            maxColorDiff: 250
        },
        {
            blockCount: 9,
            points: 5,
            minColorDiff: 100,
            maxColorDiff: 300
        },
        {
            blockCount: 6,
            points: 10,
            minColorDiff: 50,
            maxColorDiff: 100
        },
        {
            blockCount: 6,
            points: 15,
            minColorDiff: 10,
            maxColorDiff: 75
        }
    ]

    const data = {
        colorTuples: [],
        colorStrings: [],
        color: "",
        difficulty: 0,
        score: 0,

        get difficultyConfig() {
            return DIFFICULTY_CONFIGS[this.difficulty];
        }
    }

    const allColContainer = document.getElementById("colors-container");
    const headerColContainer = document.getElementById("header-color-container");

    // Event handlers

    const guessColor = evt => {
        let color = evt.target.dataset.color;

        if (color === data.color) {
            evt.target.classList.add("correct");
            document.querySelectorAll(".color-block").forEach(elem => {
                elem.removeEventListener("click", guessColor);
                elem.classList.remove("clickable");
            })
            data.score += data.difficultyConfig.points;
        } else {
            evt.target.classList.add("wrong");
            data.score = 0;
        }

        if (data.score >= 10) {
            document.getElementById("header-color-container").classList.add("golden");
        } else {
            document.getElementById("header-color-container").classList.remove("golden");
        }
        document.getElementById("score").textContent = data.score;
    }

    const selectDifficulty = evt => {
        let newDifficulty = parseInt(evt.target.dataset.difficulty);

        if (data.difficulty !== newDifficulty) {
            data.difficulty = newDifficulty;
            document.querySelector(".difficulty-select.selected").classList.remove("selected");
            evt.target.classList.add("selected");
            data.score = 0;
            newColors();
        }
    }

    // Functions

    const findColorWithDifference = (minDiff, maxDiff, otherColors) => {
        let i = 0;
        colorloop: while (true) {
            let newR = Math.floor(Math.random() * 255);
            let newG = Math.floor(Math.random() * 255);
            let newB = Math.floor(Math.random() * 255);

            if (i++ > 500) {
                console.warn("Given up searching for a fitting color!");
                return [newR, newG, newB];
            }

            for (let otherColor of otherColors) {
                let [oR, oG, oB] = otherColor;
                let diff = Math.sqrt(Math.pow(oR - newR, 2) + Math.pow(oG - newG, 2) + Math.pow(oB - newB, 2));

                if (minDiff && diff < minDiff) continue colorloop;
                if (maxDiff && diff > maxDiff) continue colorloop;
            }

            return [newR, newG, newB];
        }
    }

    const generateColors = () => {
        data.colorStrings = [];
        data.colorTuples = [];

        for (let i = 0; i < data.difficultyConfig.blockCount; i++) {

            let colorTuple = findColorWithDifference(data.difficultyConfig.minColorDiff, data.difficultyConfig.maxColorDiff, data.colorTuples);
            let [r, g, b] = colorTuple;
            let colorString = `rgb(${r}, ${g}, ${b})`;
            data.colorTuples.push(colorTuple)
            data.colorStrings.push(colorString);
        }

        data.color = data.colorStrings[Math.floor(Math.random() * data.colorStrings.length)];
    }

    const displayColors = () => {
        allColContainer.innerHTML = "";

        for (let color of data.colorStrings) {
            let elem = document.createElement("div");
            elem.classList.add("color-block");
            elem.classList.add("clickable");
            elem.dataset.color = color;
            elem.style.setProperty("--bg-color", color);
            elem.addEventListener("click", guessColor);

            allColContainer.append(elem);
        }

        headerColContainer.textContent = data.color;
    }

    const newColors = () => {
        generateColors();
        displayColors();
    }

    // Code

    newColors();

    document.getElementById("btn-next").addEventListener("click", newColors);
    document.querySelectorAll(".difficulty-select").forEach(elem => {
        elem.addEventListener("click", selectDifficulty);
    })

    document.getElementById("toggle-difficulties").addEventListener("click", () => {
        document.getElementById("controls").classList.toggle("difficulties_shown");
    })
})