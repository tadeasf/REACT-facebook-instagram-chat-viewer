/** @format */

import React, { useState } from "react";
import "./index.scss";
import { DateTime } from "luxon";

const Message = ({ message, time, type, author, uuid, isHighlighted }) => {
  const [visibility, setVisibility] = useState(false);

  const errorFile = {
    fontWeight: "bold",
  };

  const whatKindIs = () => {
    if (type === "Generic" || type === null) {
      if (message.content) return <p>{message.content}</p>;
      else if (message.photos)
        return <p style={errorFile}>Foto isn't available</p>;
      else if (message.videos)
        return <p style={errorFile}>Video isn't available</p>;
      else if (message.audio_files)
        return <p style={errorFile}>Audio isn't available</p>;

      return false;
    }
    if (message.content) return <p>{message.content}</p>;
    else if (message.share)
      return (
        <a
          href={message.share.link}
          className="post-link"
          target="_blank"
          rel="noreferrer"
        >
          {message.share.link}
        </a>
      );

    return false;
  };

  const handleClick = () => {
    setVisibility(!visibility);
  };

  return (
    <>
      {whatKindIs() ? (
        <div
          data-uuid={uuid}
          style={
            visibility ? { display: "flex", zIndex: 1000 } : { display: "flex" }
          }
          className={`message-container ${
            author ? "message-sent-container" : ""
          }`}
        >
          <div
            className={`message ${author ? "message-sent" : "message-received"}
            ${isHighlighted ? "message-highlighted" : ""}`}
            onClick={handleClick}
          >
            <div
              className="sender-name"
              style={
                visibility
                  ? {
                      display: "block",
                      fontSize: "1em",
                      padding: "0.5em",
                      justifyContent: "center",
                      fontStyle: "italic",
                    }
                  : { display: "none" }
              }
            >
              {message.sender_name}
            </div>
            {whatKindIs()}
            <div
              className="time-ago"
              style={
                visibility
                  ? {
                      display: "block",
                      fontSize: "0.85em",
                      padding: "0.5em",
                      justifyContent: "center",
                      fontStyle: "italic",
                    }
                  : { display: "none" }
              }
            >
              <p>{DateTime.fromSeconds(time / 1000).toLocaleString()}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Message;
