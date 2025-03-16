// Function to extract text 20 characters before and after common symbols
function extractFoodItems() {
    let foodItems = new Set(); // Use Set to prevent duplicates
    let elements = document.querySelectorAll("*:not(script):not(style)"); // Get all visible elements

    let symbols = ["®", "™", "©", "℠"]; // Common symbols used in brand names

    elements.forEach(el => {
        if (el.innerText) {
            let text = el.innerText;

            symbols.forEach(symbol => {
                let index = text.indexOf(symbol);
                if (index !== -1) { // If symbol is found
                    let start = Math.max(0, index - 20); // Ensure we don’t go out of bounds
                    let end = Math.min(text.length, index + 20); // Capture 20 chars after
                    let foodName = text.substring(start, end).trim(); // Extract text around symbol
                    if (foodName.length > 2) { // Avoid short, invalid text
                        foodItems.add(foodName);
                    }
                }
            });
        }
    });

    return Array.from(foodItems); // Convert Set back to array
}

// Function to fetch nutrition data and sum up total calories
async function calculateTotalCalories() {
    let foodItems = extractFoodItems();
    console.log("Detected Food Items:", foodItems);

    let apiKey = "YOUR_API_KEY"; // Replace with your CalorieNinjas API key
    let totalCalories = 0;

    for (let foodItem of foodItems) {
        let query = encodeURIComponent(foodItem);

        try {
            let response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${query}`, {
                method: 'GET',
                headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' }
            });

            let result = await response.json();

            if (result.items && result.items.length > 0) {
                let calories = result.items[0].calories;
                totalCalories += calories; // Add to total

                console.log(`Food: ${foodItem}, Calories: ${calories}`);
            } else {
                console.log(`No nutrition data found for ${foodItem}`);
            }
        } catch (error) {
            console.error('Error fetching nutrition data:', error);
        }
    }

    // Calculate total walk time (assuming 300 calories burned per hour)
    let walkingHours = totalCalories / 300;
    let totalWalkingTime = `${Math.floor(walkingHours)}h ${Math.round((walkingHours % 1) * 60)}m`;

    console.log(`\nTotal Calories: ${totalCalories}`);
    console.log(`Estimated Total Walk Time: ${totalWalkingTime}`);

    // Add the popup to the page
    showPopup(totalCalories, totalWalkingTime);
}

// Function to show a floating popup
function showPopup(calories, walkTime) {
    // Remove any existing popup
    let existingPopup = document.getElementById("walk-off-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create the popup container
    let popup = document.createElement("div");
    popup.id = "walk-off-popup";
    popup.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            background: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2);
            font-family: Arial, sans-serif;
            z-index: 10000;
        ">
            <div style="display: flex; align-items: center;">
                <img src="https://i.imgur.com/4rRZJ1X.png" width="40" height="40" style="margin-right: 12px;">
                <div>
                    <strong>Walk off your order in ${walkTime}</strong>
                    <p style="margin: 4px 0; font-size: 14px; color: #555;">
                        This order has <strong>${calories} calories</strong>. Based on an average walking pace, you’ll burn it off in approximately <strong>${walkTime}</strong>.
                    </p>
                </div>
            </div>
            <button id="remind-me-btn" style="
                width: 100%;
                margin-top: 8px;
                padding: 8px;
                background: #E53935;
                border: none;
                color: white;
                font-size: 14px;
                cursor: pointer;
                border-radius: 8px;
            ">Remind me to walk</button>
            <button id="close-popup-btn" style="
                width: 100%;
                margin-top: 8px;
                padding: 8px;
                background: #aaa;
                border: none;
                color: white;
                font-size: 14px;
                cursor: pointer;
                border-radius: 8px;
            ">Stop telling me this</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Add event listener for "Remind me to walk"
    document.getElementById("remind-me-btn").addEventListener("click", () => {
        // Create a Google Calendar reminder
        const eventTitle = `Walk off ${calories} calories`;
        const eventDescription = `This is a reminder to walk off ${calories} calories. You will burn these calories in approximately ${walkTime}.`;
        const eventStartTime = new Date();
        eventStartTime.setMinutes(eventStartTime.getMinutes() + 5); // Remind 5 minutes from now

        // Construct the Google Calendar URL with event details
        const calendarURL = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDescription)}&dates=${eventStartTime.toISOString().replace(/-|:|\.\d+/g, '')}/${eventStartTime.toISOString().replace(/-|:|\.\d+/g, '')}`;

        // Open Google Calendar in a new window
        window.open(calendarURL, '_blank');
    });

    // Add event listener for "Stop telling me this"
    document.getElementById("close-popup-btn").addEventListener("click", () => {
        // Navigate to the Chrome extensions page
        window.location.href = "chrome://extensions/";
    });
}

// Main script execution
if (window.location.href.startsWith("https://www.doordash.com/consumer/checkout/")) {
    console.log("You're on the DoorDash checkout page.");
    calculateTotalCalories(); // Fetch and sum calories
}
