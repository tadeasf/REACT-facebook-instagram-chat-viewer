/** @format */

import { useState, useEffect, useRef } from "react";
import "./App.scss";
import Message from "./components/Message/Message";
import { ErrorBoundary } from "react-error-boundary";
import { v4 as uuidv4 } from "uuid";
import debounce from "lodash.debounce";
import { remove as removeDiacritics } from "diacritics";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Select from "react-select";

import photo1 from "./assets/generic-photo1.png"; /// you can putt a lot of photos here

const photos = [photo1];

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
  const searchRef = useRef();
  const [numberOfResults, setNumberOfResults] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [maxPage, setMaxPage] = useState(1);
  const listRef = useRef(); // Add this ref
  const rowHeights = useRef({}); // Add this ref
  const [scrollToIndex, setScrollToIndex] = useState(-1);
  const [contentSearchIndex, setContentSearchIndex] = useState(-1);
  const [searchContent, setSearchContent] = useState("");
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState(-1);
  const [numberOfResultsContent, setNumberOfResultsContent] = useState(0);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  const scrollToContent = (content) => {
    const messageIndex = uploadedMessages.findIndex(
      (message, index) =>
        index > contentSearchIndex &&
        message.content &&
        message.content.includes(content)
    );

    if (messageIndex !== -1) {
      setContentSearchIndex(messageIndex);
      setScrollToIndex(messageIndex);
      setHighlightedMessageIndex(messageIndex); // Add this line
    } else {
      console.error("No more messages with the given content found.");
    }
  };

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

  useEffect(() => {
    if (scrollToIndex !== -1) {
      listRef.current.scrollToItem(scrollToIndex, "center");
      setScrollToIndex(-1);
    }
  }, [scrollToIndex]);

  function getRowHeight(index) {
    return rowHeights.current[index] || 95; // Add this function
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
    searchRef.current = debounce(() => {
      setSearchTerm(debouncedSearchTerm);
    }, 500);

    return () => {
      clearTimeout(searchRef.current);
    };
  }, [debouncedSearchTerm]);

  useEffect(() => {
    searchRef.current();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch("https://YOUR_BACKEND/collections");
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
        `https://YOUR_BACKEND.com/messages/${collectionName}`
      );
      const data = await response.json();

      // Generate UUIDs for messages
      const messagesWithUUID = data.map((message) => {
        return {
          ...message,
          _id: uuidv4(),
        };
      });

      // Cache the uploaded messages
      setUploadedMessages(messagesWithUUID);

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
    if (debouncedSearchTerm.length === 0) {
      setIsSearchActive(false);
    } else {
      setIsSearchActive(true);
    }
  }, [debouncedSearchTerm]);

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

  // Update maxPage when updating filteredMessages
  useEffect(() => {
    setMaxPage(Math.ceil(numberOfResults / 150000));
  }, [numberOfResults]);

  const handleScroll = () => {
    if (isLoading || isSearchActive) return;

    const chatBody = chatBodyRef.current;
    const scrollTop = chatBody.scrollTop;
    const scrollHeight = chatBody.scrollHeight;
    const clientHeight = chatBody.clientHeight;

    // Scroll to the bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (page < maxPage) {
        setPage((prevPage) => prevPage + 1);
      }
    }
    // Scroll to the top
    else if (scrollTop <= 100) {
      setPage((prevPage) => Math.max(prevPage - 1, 1));
    }
  };

  // const style = {
  //   width: "100%",
  //   height: "90%",
  //   "overflow-y": "auto",
  //   "overflow-x": "hidden",
  // };

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
      boxShadow: "none",
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
      display: "none",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "white",
    }),
  };

  const handleDelete = async (collectionName) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://YOUR_BACKEND.com/delete/${collectionName}`,
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

      const response = await fetch("https://YOUR_BACKEND/upload", {
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
            // Return true if normalizedContent includes the normalizedSearchContent
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
                onScroll={handleScroll}
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
                                uuid={messageArray._id}
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
          <div className="footer">
            <div className="upload-container">
              <input
                className="file-input button"
                type="file"
                onChange={(e) => uploadFile(e.target.files)} // Replace with your actual upload function
              />
            </div>
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
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
