import React, { useState, useEffect } from 'react'

import { camelToTitle } from '../tools/Utils'
import Arrow from '../components/indicator/arrow/Arrow'

import './HelpPage.css'

// Help popup to display descriptions, keyboard shortcuts, contact/links and so on
const HelpPage = ({descriptions, shortcuts, contact, visibility, page, onCloseCallback}) => {
    // The current visible stage
    const [currentPage, setCurrentPage] = useState(0);
    const max = 2; 

    useEffect(() => {
        if(page) setCurrentPage(page);
    }, [page])

    const handleClose = (e) => {
        onCloseCallback(e);
    };

    // Switch page in a specified direction 
    const handleContentSwitch = (direction) => {
        setCurrentPage(Math.max(Math.min(currentPage + direction, max), 0));
    };

    // Returns the page for all the keyboard shortcuts
    const getShortcuts = () => {
        // Creates a single shortcut (key/command) entry
        const getShortcutEntry = (shortcut) => {
            // Formats a single key
            const formatKey = (key) => {
                switch(key) {
                    case ' ': return "Space";
                    case '-': return "Minus";
                    case '+': return "Plus";
                    default: return camelToTitle(key);
                }
            };

            // Holds all the formatted keys (there can be multiple keys for a single command)
            var keys = "";

            // If multiple keys are linkde to a single command, separate with "/"
            if(Array.isArray(shortcut.keys)) {
                keys = shortcut.keys.reduce((acc, v) => formatKey(acc) + " / " + formatKey(v))
            } else {
            // Otherwise, just format the single key
                keys = formatKey(shortcut.keys);
            }

            // Return entire key/command entry
            return (
                <div className="shortcut-entry">
                    <div className="shortcut-entry__keys">
                        {keys}
                    </div>
                    <div className="shortcut-entry__description">
                        {shortcut.description}
                    </div>
                </div>
            );
        };

        // Creates all content of the shortcuts page
        return (
            <div className="help-page__content__shortcuts">
                <h2 className="title">Keyboard shortcuts</h2>
                {/* Add column indicators */}
                <div className="shortcut__columns">
                    <div className="shortcut_columns__key">Key</div>
                    <div className="shortcut_columns__description">Functionality</div>
                </div>
                {
                    // Iterate  over all shortcuts...
                    shortcuts.map((shortcut, index) => (
                        <div key={index}>{getShortcutEntry(shortcut)}</div>
                    ))
                }
            </div>
        )
    };

    // Returns all the descriptions with titles and content
    const getDescriptions = () => {
        // Creates a single description entry
        const getDescriptionEntry = (description, index) => {
            return (
                <div 
                    className="descriptions-entry"
                    key={index}
                >
                    <h3 className="descriptions-entry__title">
                        {description.title}
                    </h3>
                    <div className="description-entry__content">
                        {description.content}
                    </div>
                </div>
            )
        };

        // Returns entire content of descriptions page
        return (
            <div
                className="help-page__content__descriptions"
            >
                <h2 className="title">Recursive Domain Warping Controller</h2>
                {
                    // Iterate over all descriptions...
                    descriptions.map((description, index) => (
                        getDescriptionEntry(description, index)
                    ))
                }
            </div>
        )
    };

    // Returns all contact information and links, etc
    const getContact = () => {
        // Creates a category of links
        const createCategory = (category, index) => {
            // Creates a single link entry
            const createEntry = (entry, subindex) => {
                return (
                    <div
                        className="contact-category__entry"
                        key={index + "." + subindex}
                    >
                        <div className="contact-category__entry__location">
                            <a 
                                className="contact-category__entry__link"
                                href={entry.link}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {entry.icon ? <img className="icon" src={entry.icon} /> : null} 
                                <div className="contact-category__entry__link__text">
                                    {entry.location}
                                </div>
                            </a>
                        </div>
                        <div className="contact-category__entry__description">
                            {entry.description}
                        </div>
                    </div>
                );
            };

            // Returns all links for a specific entry
            return (
                <div 
                    key={index}
                    className="contact-category"
                >
                    <h4 className="contact-category__title">{category.title}</h4>
                    {
                        // Iterate over all category entries...
                        category.entries.map((entry, index) => {
                            return createEntry(entry, index)
                        })
                    }
                </div>
            );
        } 

        // Returns entire contect of contact page
        return (
            <div className="help-page__content__contact"
            >
                <h2 className="title">Contact and Links</h2>
                {
                    // Iterate over all categories...
                    contact.map((category, index) => {
                        return createCategory(category, index)
                    })
                }
            </div>
        )
    }

    // Returns the content of the currently viewed page
    const getContent = () => {
        switch (currentPage) {
            case 0: return getDescriptions();
            case 1: return getShortcuts();
            case 2: return getContact();
            default: return null;
        }
    };

    // The entire help page modal
    return (
        <div 
            className={"help-page" 
                + (visibility ? " help-page--visible" : "")}
        >
            { /* Close button */ }
            <button 
                className="help-page__close-button" 
                onClick={handleClose}
            />

            { /* The current content */}
            <div className="help-page__content">
                {getContent()}
            </div>

            { /* Bottom navigation buttons for switching page */ }
            <nav className="help-page__buttons">
                {/* Previous button */ }
                <button 
                    className={
                        "help-page__buttons__button help-page__buttons__previous"
                        + (currentPage === 0 ? " help-page__buttons__disabled" : "")
                    }
                    onClick={() => handleContentSwitch(-1)}
                >
                    <Arrow direction={"left"} />
                    <Arrow direction={"left"} />
                    <Arrow direction={"left"} />
                   {/* <span>Previous</span>*/}
                </button>

                {/* Page indicator */ }
                <div className="help-page__side-number">{(currentPage + 1)}/3</div>

                {/* Next button */ }
                <button 
                    className={
                        "help-page__buttons__button help-page__buttons__next"
                        + (currentPage === max ? " help-page__buttons__disabled" : "")
                    }
                    onClick={() => handleContentSwitch(+1)}
                >
                    <Arrow direction={"right"} />
                    <Arrow direction={"right"} />
                    <Arrow direction={"right"} />
                </button>
            </nav>
        </div>
    )
}

export default HelpPage
