/** @format */

import { useState, useEffect, useRef } from "react";
import "./App.scss";
import Message from "./components/Message/Message";
import { ErrorBoundary } from "react-error-boundary";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Select from "react-select";
import photo1 from "./assets/generic-photo1.jpg";
import photo2 from "./assets/generic-photo2.jpg";
import photo3 from "./assets/generic-photo3.jpg";
import photo4 from "./assets/generic-photo4.jpg";
import photo5 from "./assets/generic-photo5.jpg";
import photo6 from "./assets/generic-photo6.jpg";
import photo9 from "./assets/generic-photo9.jpg";
import photo10 from "./assets/generic-photo10.jpg";
import photo11 from "./assets/generic-photo11.jpg";
import photo12 from "./assets/generic-photo12.jpg";
import photo13 from "./assets/generic-photo13.jpg";
import photo14 from "./assets/generic-photo14.jpg";
import photo16 from "./assets/generic-photo16.jpg";
import photo17 from "./assets/generic-photo17.jpg";
import photo18 from "./assets/generic-photo18.jpg";
import photo19 from "./assets/generic-photo19.jpg";
import photo26 from "./assets/generic-photo26.jpg";
import photo27 from "./assets/generic-photo27.jpg";
import photo28 from "./assets/generic-photo28.jpg";
import photo29 from "./assets/generic-photo29.jpg";

const photos = [
  photo1,
  photo2,
  photo3,
  photo4,
  photo5,
  photo6,
  photo9,
  photo10,
  photo11,
  photo12,
  photo13,
  photo14,
  photo16,
  photo17,
  photo18,
  photo19,
  photo26,
  photo27,
  photo28,
  photo29,
];

function App() {
  const [author, setAuthor] = useState("");
  const [user, setUser] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedMessages, setUploadedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const chatBodyRef = useRef();
  const [randomPhoto, setRandomPhoto] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [collections, setCollections] = useState([]);
  const [numberOfResults, setNumberOfResults] = useState(0);
  const listRef = useRef(); // Add this ref
  const rowHeights = useRef({}); // Add this ref
  const [scrollToIndex, setScrollToIndex] = useState(-1);
  const [contentSearchIndex, setContentSearchIndex] = useState(-1);
  const [searchContent, setSearchContent] = useState("");
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState(-1);
  const [numberOfResultsContent, setNumberOfResultsContent] = useState(0);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  const scrollToTop = () => {
    setContentSearchIndex(0);
    setScrollToIndex(0);
    setHighlightedMessageIndex(-1);
  };

  const handleContentKeyPress = (e) => {
    if (e.key === "Enter") {
      scrollToContent(searchContent);
      // Increment the current result index
      setCurrentResultIndex((prevIndex) =>
        prevIndex + 1 < numberOfResultsContent ? prevIndex + 1 : 0
      );
    }
  };

  const removeDiacritics = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const scrollToContent = (content) => {
    const normalizedContent = removeDiacritics(content.toLowerCase());
    console.log("Searching for:", normalizedContent);
    let messageIndex = -1;

    for (let i = 1; i <= uploadedMessages.length; i++) {
      const currentIndex = (contentSearchIndex + i) % uploadedMessages.length;
      const currentMessage = uploadedMessages[currentIndex];

      if (!currentMessage.content) {
        continue;
      }

      const normalizedMessageContent = removeDiacritics(
        currentMessage.content.toLowerCase()
      );
      console.log("Checking message:", currentIndex, normalizedMessageContent);

      if (normalizedMessageContent.includes(normalizedContent)) {
        messageIndex = currentIndex;
        break;
      }
    }

    if (messageIndex !== -1) {
      console.log("Message found:", messageIndex);
      setContentSearchIndex(messageIndex);
      setScrollToIndex(messageIndex);
      setHighlightedMessageIndex(messageIndex);
    } else {
      console.error("No more messages with the given content found.");
    }
  };

  useEffect(() => {
    if (scrollToIndex !== -1) {
      listRef.current.scrollToItem(scrollToIndex, "center");
      setScrollToIndex(-1);
    }
  }, [scrollToIndex]);

  function getRowHeight(index) {
    return rowHeights.current[index] || 110; // Add this function
  }
  const setRowHeight = (index, size) => {
    // Add this function
    listRef.current.resetAfterIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  };

  useEffect(() => {
    const randomPhotoIndex = Math.floor(Math.random() * photos.length);
    const selectedPhoto = photos[randomPhotoIndex];
    setRandomPhoto(selectedPhoto);
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(
          "https://YOUR_BACKEND_SERVER_HTTP/collections"
        );
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCollections();
  }, []);

  const collectionOptions = collections.map((collection) => ({
    label: collection,
    value: collection,
  }));

  const handleSend = async (collectionName) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://YOUR_BACKEND_SERVER_HTTP/messages/${collectionName}`
      );
      const data = await response.json();

      const mappedMessages = data.map((message) => {
        return {
          ...message,
        };
      });

      // Cache the uploaded messages
      setUploadedMessages(mappedMessages);

      // Set the author and user states only if they are not already set
      if (!author || !user) {
        // Get the unique sender names from the data
        const uniqueSenders = [
          ...new Set(data.map((message) => message.sender_name)),
        ];

        uniqueSenders.forEach((sender) => {
          if (sender === "Tadeáš Fořt" || sender === "Tadeáš") {
            setAuthor(sender);
          } else {
            setUser(sender);
          }
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const normalizedSearchTerm = removeDiacritics(
      debouncedSearchTerm.toLowerCase()
    );
    const messagesPerPage = 150000;

    let messagesSorted = [...uploadedMessages];

    // Sort messages by timestamp in descending order
    messagesSorted.sort((a, b) => b.timestamp - a.timestamp);

    let filteredMsgs =
      debouncedSearchTerm.length === 0
        ? messagesSorted
        : messagesSorted.filter((messageArray) => {
            if (!messageArray.content) return false;
            const normalizedContent = removeDiacritics(
              messageArray.content.toLowerCase()
            );
            // Return true if normalizedContent includes the normalizedSearchTerm
            return normalizedContent.includes(normalizedSearchTerm);
          });
    // Update numberOfResults
    setNumberOfResults(filteredMsgs.length);
    // Slice messages array for pagination
    filteredMsgs = filteredMsgs.slice(
      Math.max(page - 2, 0) * messagesPerPage,
      page * messagesPerPage
    );

    setFilteredMessages(filteredMsgs);
  }, [debouncedSearchTerm, uploadedMessages, page]);

  const refresh = async () => {
    setIsLoading(true); // Set isLoading to true when refresh is triggered
    setPage(1);
    setDebouncedSearchTerm(""); // Reset the debounced search term
    setContentSearchIndex(-1);
    setSearchContent("");
    setHighlightedMessageIndex(-1);

    // Scroll to the top of the message list
    scrollToTop();

    if (uploadedMessages.length > 0) {
      setFilteredMessages(uploadedMessages);
      setNumberOfResults(uploadedMessages.length);
      setSearchTerm("");
      setIsLoading(false); // Set isLoading to false when the messages are updated
    } else if (collectionName) {
      await handleSend(collectionName);
      setIsLoading(false); // Set isLoading to false after handleSend is completed
    } else {
      setIsLoading(false); // Set isLoading to false if no messages and no collectionName
    }
  };

  const hiddenScrollbarStyle = {
    scrollbarWidth: "none", // for Firefox
    msOverflowStyle: "none", // for Internet Explorer and Edge
  };

  const dropdownStyles = {
    control: (provided) => ({
      ...provided,
      border: "none",
      boxShadow: "none",
      backgroundColor: "#333",
      cursor: "pointer",
    }),
    menu: (provided) => ({
      ...provided,
      border: "black 1px solid",
      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#333",
      width: "20em",
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: "#333",
      color: "white",
      cursor: "pointer",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "white",
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      color: "white",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "white",
    }),
    input: (provided) => ({
      ...provided,
      color: "white",
    }),
  };

  const handleDelete = async (collectionName) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://YOUR_BACKEND_SERVER_HTTP/delete/${collectionName}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setCollections(collections.filter((col) => col !== collectionName));
      } else {
        console.error("Error deleting collection");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (files) => {
    if (!files || files.length === 0) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const response = await fetch("https://YOUR_BACKEND_SERVER_HTTP/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming the uploaded collection name is returned as "collectionName" in the response
        setCollections([...collections, data.collectionName]);
        alert("File uploaded successfully!");
      } else {
        console.error("Error uploading file");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const normalizedSearchContent = removeDiacritics(
      searchContent.toLowerCase()
    );

    let filteredMsgsByContent =
      searchContent.length === 0
        ? uploadedMessages
        : uploadedMessages.filter((messageArray) => {
            if (!messageArray.content) return false;
            const normalizedContent = removeDiacritics(
              messageArray.content.toLowerCase()
            );
            return normalizedContent.includes(normalizedSearchContent);
          });

    setNumberOfResultsContent(filteredMsgsByContent.length);
  }, [searchContent, uploadedMessages]);

  return (
    <ErrorBoundary>
      <div className="container">
        <div className="header">
          <div>
            <div className="collection-container">
              <Select
                value={collectionOptions.find(
                  (option) => option.value === collectionName
                )}
                onChange={(selectedOption) => {
                  setCollectionName(selectedOption.value);
                  handleSend(selectedOption.value);
                }}
                options={collectionOptions}
                placeholder="Select a collection"
                isSearchable={true}
                isMulti={false}
                isClearable={true}
                styles={dropdownStyles}
                menuPortalTarget={document.body}
              />
            </div>
          </div>
          <div className="search-container">
            <p>
              <span className="search-term">
                {searchContent !== ""
                  ? `Found ${
                      currentResultIndex + 1
                    }/${numberOfResultsContent} of: ${searchContent}`
                  : `Total number of messages: ${numberOfResults}`}
              </span>
            </p>
            <div className="content-input-container">
              <input
                className="content-input button"
                type="text"
                placeholder="Search by content"
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                onKeyDown={handleContentKeyPress}
              />
            </div>
            <button className="reset-button" onClick={refresh}>
              Refresh
            </button>
          </div>
        </div>
        <div className="chat-container">
          <div className="chat">
            <div className="chat-header">
              <img
                src={randomPhoto}
                alt="user-profile"
                className="chat-photo"
              />
              <p>{user ? user : "Waiting for file upload..."}</p>
            </div>
            {isLoading ? (
              <div className="chat-body loading">
                <div className="loading-bar" />
              </div>
            ) : (
              <div
                className="chat-body"
                ref={chatBodyRef}
                style={{ height: "calc(100vh - 150px)", position: "relative" }}
              >
                {filteredMessages.length > 0 ? (
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        itemCount={filteredMessages.length}
                        itemSize={getRowHeight}
                        width={width}
                        ref={listRef}
                        // Add this prop to control scrolling
                        scrollToAlignment="center"
                      >
                        {({ index, style }) => {
                          const messageArray = filteredMessages[index];
                          const isLastMessage =
                            index === filteredMessages.length - 1;
                          return (
                            <div
                              style={{ ...style, ...hiddenScrollbarStyle }}
                              key={index}
                            >
                              <Message
                                message={messageArray}
                                author={!!(messageArray.sender_name === author)}
                                time={messageArray.timestamp_ms}
                                key={messageArray.timestamp_ms}
                                isLastMessage={isLastMessage}
                                searchTerm={searchTerm}
                                setRowHeight={setRowHeight}
                                index={index}
                                isHighlighted={
                                  index === highlightedMessageIndex
                                } // Add this prop
                              />
                            </div>
                          );
                        }}
                      </List>
                    )}
                  </AutoSizer>
                ) : (
                  <p>No messages found</p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="footer">
          <div className="delete-container">
            <Select
              onChange={(selectedOption) => {
                handleDelete(selectedOption.value);
              }}
              options={collectionOptions}
              placeholder="Delete a collection"
              isSearchable={true}
              isMulti={false}
              isClearable={true}
              styles={dropdownStyles}
              menuPortalTarget={document.body}
            />
          </div>
          <input
            className="upload-input button"
            type="file"
            onChange={(e) => uploadFile(e.target.files)} // Replace with your actual upload function
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
