
// Starting notes
let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" }
];


// Search for notes containing a certain word
function searchNotes(word) {
    let result = [];

    for (let note of notes) {
        if (note.text.toLowerCase().includes(word.toLowerCase())) {
            result.push(note);
        }
    }

    return result;
}

console.log(searchNotes("javascript"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("football"));
// Expected: []


// Find the longest note
function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    let longest = notes[0];

    for (let note of notes) {
        if (note.text.length > longest.text.length) {
            longest = note;
        }
    }

    return longest;
}

console.log(longestNote());
// Expected: Note with id 3, "Email the project report to Grace"

let oldNotes = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = oldNotes;


// Count notes according to their categories
function countByCategory() {
    let count = {
        personal: 0,
        work: 0,
        study: 0
    };

    for (let note of notes) {
        if (note.category === "personal") {
            count.personal++;
        } else if (note.category === "work") {
            count.work++;
        } else if (note.category === "study") {
            count.study++;
        }
    }

    return count;
}

console.log(countByCategory());
// Expected: { personal: 2, work: 1, study: 2 }

notes = [];

console.log(countByCategory());
// Expected: { personal: 0, work: 0, study: 0 }

notes = oldNotes;


// Give a summary of all the notes
function getSummary() {
    let count = countByCategory();
    let total = notes.length;

    let word = "notes";

    if (total === 1) {
        word = "note";
    }

    return total + " " + word + ": " +
        count.personal + " personal, " +
        count.work + " work, " +
        count.study + " study.";
}

console.log(getSummary());
// Expected: 5 notes: 2 personal, 1 work, 2 study.

let savedNotes = notes;
notes = [
    { id: 1, text: "Call mum", category: "personal" }
];

console.log(getSummary());
// Expected: 1 note: 1 personal, 0 work, 0 study.

notes = savedNotes;


// Check if a note already exists
function isDuplicate(text) {
    let newText = text.trim().replace(/\s+/g, " ").toLowerCase();

    for (let note of notes) {
        let oldText = note.text.trim().replace(/\s+/g, " ").toLowerCase();

        if (oldText === newText) {
            return true;
        }
    }

    return false;
}

console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true

console.log(isDuplicate("Buy some rice"));
// Expected: false


// Add a new note
function addNote(text, category) {
    let cleanText = text.trim();

    if (cleanText.length < 1 || cleanText.length > 200) {
        console.log("Note must be between 1 and 200 characters.");
        return false;
    }

    if (isDuplicate(cleanText)) {
        console.log("This note already exists.");
        return false;
    }

    if (category !== "personal" &&
        category !== "work" &&
        category !== "study") {
        console.log("Invalid category.");
        return false;
    }

    let newId = 1;

    if (notes.length > 0) {
        newId = notes[notes.length - 1].id + 1;
    }

    let newNote = {
        id: newId,
        text: cleanText,
        category: category
    };

    notes.push(newNote);

    console.log("Note added successfully.");
    return true;
}

console.log(addNote("Complete JavaScript revision", "study"));
// Expected: true

console.log(addNote("   ", "study"));
// Expected: false

console.log(addNote("Buy milk and bread", "personal"));
// Expected: false

console.log(addNote("Attend business meeting", "business"));
// Expected: false

let longText = "a".repeat(201);

console.log(addNote(longText, "study"));
// Expected: false


console.log(notes);
// Expected: Original 5 notes plus "Complete JavaScript revision"

