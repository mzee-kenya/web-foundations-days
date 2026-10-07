
const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// This array stores the users received from the API.
let users = [];

/**
 * Loads users from the JSONPlaceholder API.
 */
async function loadUsers() {
    statusMessage.textContent = "Loading users...";
    loadButton.disabled = true;

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        // Check whether the server returned a successful response.
        if (!response.ok) {
            throw new Error("Failed to load users.");
        }

        users = await response.json();

        statusMessage.textContent = "Users loaded successfully.";

        renderUsers(users);
    } catch (error) {
        statusMessage.textContent =
            "Could not load users. Please try again.";

        console.log(error);
    } finally {
        // The button becomes available again after loading finishes.
        loadButton.disabled = false;
    }
}

/**
 * Displays the users passed to the function.
 * The same function can display the full list or a filtered list.
 */
function renderUsers(list) {
    // Clear the previous results before displaying the new list.
    usersList.textContent = "";

    if (list.length === 0 && filterInput.value.trim() !== "") {
        const message = document.createElement("li");
        message.textContent = "No users match your filter.";
        usersList.appendChild(message);
        return;
    }

    for (const user of list) {
        const listItem = document.createElement("li");

        const name = document.createElement("h2");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = "Email: " + user.email;

        const city = document.createElement("p");
        city.textContent = "City: " + user.address.city;

        const company = document.createElement("p");
        company.textContent = "Company: " + user.company.name;

        listItem.appendChild(name);
        listItem.appendChild(email);
        listItem.appendChild(city);
        listItem.appendChild(company);

        usersList.appendChild(listItem);
    }
}

// Load users when the button is clicked.
loadButton.addEventListener("click", loadUsers);

/*
 * Filter the users already stored in the users array.
 * This does not make another API request.
 */
filterInput.addEventListener("input", function () {
    const searchText = filterInput.value.toLowerCase().trim();

    const filteredUsers = users.filter(function (user) {
        return user.name.toLowerCase().includes(searchText);
    });

    renderUsers(filteredUsers);
});
