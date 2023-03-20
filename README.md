# REACT-facebook-instagram-chat-viewer

Chat app to look through messages and find those kinky conversations of late!

## Preparing Your Data

Before using the Facebook Message Analyzer, you'll need to export your Facebook message data as JSON files. You can use the Facebook JSON Message Data Parser to process the raw data exported from Facebook and generate JSON files that can be uploaded to the application.

Follow the instructions in the Facebook JSON Message Data Parser repository to prepare your JSON files for analysis.

## Running the Application

Once your JSON files are prepared, you can run the Facebook Message Analyzer to start analyzing your messages:

1. Open your browser and navigate to http://localhost:3000 (if the application isn't already running, start it using `npm start`).

2. Click the "Choose File" button and select the JSON file you want to analyze.

3. Use the "Select a collection" dropdown to manage your message collections.

4. Use the "Search" input field to search messages by content.

5. Use the "Search by UUID" input field to search messages by UUID.

6. Use the "Search by content" input field to search messages by specific content.

## Usage

- Upload a JSON file: Click the "Choose File" button and select the JSON file containing your Facebook message data.
- Select a collection: Use the "Select a collection" dropdown to switch between different message collections. You can also delete a collection by selecting it in the "Delete a collection" dropdown in the footer.
- Search messages: Use the "Search" input field to search messages by content. Press Enter to jump to the next result.
- Search by UUID: Use the "Search by UUID" input field to search messages by UUID.
- Search by content: Use the "Search by content" input field to search messages by specific content. Press Enter to jump to the next result.
- View message details: Click on a message to view its details, including sender name, UUID, and timestamp.

## Known Limitations

- The application may experience performance issues when handling large JSON files or a large number of messages.
- Media files (photos, videos, and audio) are not available for display within the application.
- The search functionality might not work correctly with special characters or diacritics.
- The application does not support pagination, which could lead to performance issues when displaying a large number of results.

Please report any bugs or issues you encounter while using the Facebook Message Analyzer. Your feedback is greatly appreciated!

## Backend

The backend of the Facebook Message Analyzer is built using Express.js and MongoDB. It provides RESTful API endpoints to manage message collections, fetch messages, upload new messages, and delete collections. The backend uses `multer` for handling file uploads and `cors` to manage Cross-Origin Resource Sharing.

### How it works

The backend connects to a MongoDB instance to store and retrieve messages. It provides the following API endpoints:

- `GET /collections`: Fetches a list of message collections.
- `GET /messages/:collectionName`: Fetches messages from a specific collection.
- `POST /upload`: Uploads a JSON file containing messages and stores them in a new collection.
- `DELETE /delete/:collectionName`: Deletes a specific message collection.

### How to work with it

To work with the backend, make sure you have a running MongoDB instance and set the ```MONGODB_URI```

 environment variable to the correct connection URI. You can run the server locally or deploy it to a platform like Heroku.

Update the cors configuration in the app.use(cors(...)) section to match your frontend's domain and allowed origins.
What to expect

The backend provides a basic API for managing message collections and message data. It is designed to work in conjunction with the frontend and relies on the frontend for file parsing and validation.
New Features

You can extend the backend with new features such as:

    Implementing authentication and user management.
    Adding support for updating existing message collections.
    Implementing pagination and filtering options for fetching messages.
    Adding error handling and validation for user inputs.
