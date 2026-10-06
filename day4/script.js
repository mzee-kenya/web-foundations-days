
// Select the elements we need
let noteText = document.getElementById("note-text");
let charCount = document.getElementById("char-count");
let wordCount = document.getElementById("word-count");
let clearButton = document.getElementById("clear-btn");
let themeButton = document.getElementById("theme-toggle");


// Update the character and word counts
function updateCounts() {
    let text = noteText.value;
    let characters = text.length;
    let words = 0;

    // Only count words when there is some text
    if (text.trim() !== "") {
        words = text.trim().split(/\s+/).length;
    }

    charCount.textContent = characters + " / 200 characters";
    wordCount.textContent = words + " words";

    // Remove the old warning classes first
    charCount.classList.remove("warning");
    charCount.classList.remove("over");

    // Add the correct class depending on the number of characters
    if (characters > 200) {
        charCount.classList.add("over");
    } else if (characters > 180) {
        charCount.classList.add("warning");
    }
}


// Save the draft whenever the user types
noteText.addEventListener("input", function () {
    updateCounts();

    localStorage.setItem("noteDraft", noteText.value);
});


// Clear the note and remove the saved draft
function clearNote() {
    noteText.value = "";

    updateCounts();

    localStorage.removeItem("noteDraft");
}


// Clear button
clearButton.addEventListener("click", clearNote);


// Press Escape inside the textarea to clear the note
noteText.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        clearNote();
    }
});


// Change between dark and light mode
themeButton.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeButton.textContent = "Light mode";
        localStorage.setItem("theme", "dark");
    } else {
        themeButton.textContent = "Dark mode";
        localStorage.setItem("theme", "light");
    }
});


// Restore the saved draft when the page loads
let savedDraft = localStorage.getItem("noteDraft");

if (savedDraft !== null) {
    noteText.value = savedDraft;
}


// Restore the saved theme
let savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeButton.textContent = "Light mode";
}


// Update the counters when the page first loads
updateCounts();

