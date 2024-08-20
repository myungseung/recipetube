// Function to get the YouTube transcript
async function getYoutubeTranscript(youtubeURL) {
    const apiUrl = "https://api.kome.ai/api/tools/youtube-transcripts";
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
            origin: "https://kome.ai",
        },
        body: JSON.stringify({
            video_id: youtubeURL,
            format: true,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch transcript");
    }

    const transcriptData = await response.json();
    return transcriptData;
}

// Function to generate the recipe using OpenAI's GPT-4 API
async function generateRecipe(script) {
    const apiKey =
        "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"; // Replace with your actual API key
    const url = "https://api.openai.com/v1/chat/completions";

    const data = {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: [
                    {
                        type: "text",
                        text: 'You are a helpful assistant that converts YouTube scripts into recipe formats: {\n    "title": "Recipe Title",\n    "image": "Image URL",\n    "description": "Short description",\n    "ingredients": [\n        {"name": "Ingredient Name", "amount": "Quantity"}\n    ],\n    "instructions": [\n        {"stepNumber": 1, "description": "Step description"}\n    ],\n    "tools": [\n        {"name": "Tool Name"}\n    ],\n    "seasonings": [\n        {"name": "Seasoning Name", "amount": "Quantity"}\n    ]\n}',
                    },
                ],
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Convert the following YouTube script into a structured recipe JSON object in Korean.",
                    },
                ],
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: script,
                    },
                ],
            },
        ],
        temperature: 1,
        max_tokens: 4043,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: {
            type: "json_object",
        },
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
    });

    if (response.ok) {
        const result = await response.json();
        console.log(result.choices[0].message.content);
        return result.choices[0].message.content;
    } else {
        console.error(`Error: ${response.statusText}`);
    }
}

// Function to fetch the recipe: orchestrates transcript retrieval and recipe generation
async function fetchRecipe(youtubeUrl) {

    try {
        // Extract the video ID from the URL (assuming the standard YouTube URL format)
        const urlParams = new URLSearchParams(new URL(youtubeUrl).search);
        const videoId = urlParams.get("v");

        // const youtubePlayer = document.getElementById("youtubePlayer");
        // youtubePlayer.src = `https://www.youtube.com/embed/${videoId}`;

        // Step 1: Get the transcript
        const transcriptData = await getYoutubeTranscript(videoId);

        // Assuming the transcriptData has a `transcript` field containing the transcript text
        const transcriptText = transcriptData.transcript;

        // Step 2: Convert the transcript into a recipe
        const recipeJson = await generateRecipe(transcriptText);

        console.log("Raw recipe content:", recipeJson); // Log the raw content to see its format

        // Step 3: Extract JSON from OpenAI's response
        let recipe;
        try {
            // If the content is in a code block, remove it
            const match = recipeJson.match(/```json([\s\S]*?)```/);
            const jsonString = match ? match[1].trim() : recipeJson;

            recipe = JSON.parse(jsonString);
            console.log("Parsed Recipe Object:", recipe); // Log the parsed object to ensure it's correct
        } catch (parseError) {
            console.error("Failed to parse the recipe JSON:", parseError);
            alert("There was an error parsing the recipe. Please try again.");
            return;
        }

        // Step 4: Display the recipe
        displayRecipe(recipe);
    } catch (error) {
        console.error("Error:", error);
        // Optionally, display an error message to the user
        alert(
            "Failed to generate recipe. Please check the YouTube URL and try again.",
        );
    }
}


function displayRecipe(recipe) {
    console.log("Rendering recipe:", recipe); // Add this line to confirm that the function is being called

    const recipeContainer = document.getElementById("recipeContainer");
    const videoContainer = document.getElementById("videoContainer");
    const instructionsContainer = document.getElementById("instructionsList");

    // Check if the containers are properly selected
    if (!recipeContainer || !videoContainer || !instructionsContainer) {
        console.error("Required container elements not found.");
        return;
    }

    // Populate Ingredients, Seasonings, and Tools
    recipeContainer.innerHTML = `
        <div class="ingredients">
            <h3>재료</h3>
            <ul>
                ${recipe.ingredients.map(ingredient => `
                    <li>${ingredient.name} <span>${ingredient.amount}</span></li>
                `).join('')}
            </ul>
        </div>
        <div class="seasonings">
            <h3>양념</h3>
            <ul>
                ${recipe.seasonings.map(seasoning => `
                    <li>${seasoning.name} <span>${seasoning.amount}</span></li>
                `).join('')}
            </ul>
        </div>
        <div class="tools">
            <h3>도구</h3>
            <ul>
                ${recipe.tools.map(tool => `
                    <li>${tool.name} <button class="purchase-btn">구매</button></li>
                `).join('')}
            </ul>
        </div>
    `;

    // Populate Instructions
    instructionsContainer.innerHTML = `
        ${recipe.instructions.map(step => `
            <li>${step.description}</li>
        `).join('')}
    `;

    // Remove the placeholder since a recipe is now being displayed
    const placeholder = document.getElementById('recipePlaceholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
}

// Event listener to handle the button click
document.getElementById("fetchButton").addEventListener("click", function() {
    const youtubeUrl = document.getElementById("youtubeUrl").value;
    const videoContainer = document.getElementById("videoContainer");

    // Extract the video ID from the URL
    const videoId = new URLSearchParams(new URL(youtubeUrl).search).get("v");

    if (videoId) {
        // Display the video in the video container
        videoContainer.innerHTML = `
            <iframe id="youtubePlayer" width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        `;
    } else {
        alert("Invalid YouTube URL");
    }

    // Fetch and display the recipe (assuming fetchRecipe is defined)
    fetchRecipe(youtubeUrl);
});