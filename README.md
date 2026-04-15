# Gender API

## Overview
This project offers a straightforward API to predict the likely gender of a given name. It takes a name, looks it up against a public dataset, and returns a gender classification along with a confidence score and sample size. It's a quick and easy way to add gender prediction functionality to your applications without the need for complex internal data management.

## Features
-   **Name-based Gender Prediction**: Accurately predicts gender for a provided name using an external service.
-   **Confidence Scoring**: Provides a probability score and sample size for each prediction, allowing users to gauge the reliability of the result.
-   **Confidence Flag**: Automatically determines if a prediction is "confident" based on configurable thresholds (probability >= 0.7 and sample size >= 100).
-   **Input Validation**: Ensures that a name is provided and is of the correct type (string).
-   **CORS Enabled**: Configured to allow requests from any origin, making it easy to integrate with frontend applications.
-   **Standard Error Handling**: Provides clear error messages for missing parameters, invalid input, and issues with the external API or server.

## Getting Started

### Installation
To get this project up and running on your local machine, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Ladii1/gender-api.git
    cd gender-api
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

### Environment Variables
You'll need to set up the following environment variables. Create a `.env` file in the root of your project:

-   `GENDER_API_URL`: The base URL for the external gender prediction API (e.g., `https://api.genderize.io`).
-   `PORT`: The port your server will run on (e.g., `3000`).

Example `.env` file:
```
GENDER_API_URL=https://api.genderize.io
PORT=3000
```

## Usage
Once you've installed the dependencies, you can start the server and begin making requests.

1.  **Start the Server**:
    ```bash
    node index.js
    ```
    You should see a message in your console indicating that the server is running:
    ```
    Server running on port 3000
    ```

2.  **Make API Requests**:
    You can now send `GET` requests to the `/api/classify` endpoint with a `name` query parameter.

    Example using `curl`:
    ```bash
    curl "http://localhost:3000/api/classify?name=Alice"
    ```

    Example using your browser:
    Open your browser and navigate to `http://localhost:3000/api/classify?name=Alice`

## API Documentation
### Base URL
`http://localhost:3000`

### Endpoints
#### GET /api/classify
This endpoint takes a name as a query parameter and returns its predicted