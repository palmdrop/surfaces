import React, { useState, useEffect } from 'react'

import { camelToTitle } from '../tools/Utils'
import Arrow from '../components/indicator/arrow/Arrow'

import githubIcon from '../resources/icons/github.svg'
import instagramIcon from '../resources/icons/instagram.svg'
import emailIcon from '../resources/icons/email.svg'
import blogIcon from '../resources/icons/blog.svg'
import repositoryIcon from '../resources/icons/repository.png'

import './HelpPage.css'

const githubLink = "https://github.com/palmdrop";
const repositoryLink = "https://github.com/palmdrop/webgl-domain-warping-controller";
const instagramLink = "https://www.instagram.com/palmdrop/"; 
const blogLink = "https://palmdrop.github.io/"; 
const emailLink = "mailto:anton@exlex.se"; 

const descriptions=[{
        title: "A Recursive Domain Warping Controller",
        content: (
            <div>
            <p>
                Any image can be seen as a function of space. The input is a pixel location, an XY-coordinate, and the
                output is a pixel color. The width and height of the image are the domain. By warping the domain, we alter
                the space itself. Sampling a particular XY-coordinate will now (likely) result in a different output color 
                than before. This is called domain warping.
            </p>
            <p>
                This technique is commonly used for texture generation, visual effects, or generative art. This application
                makes the technique not only accessible, but fast (using GLSL shaders) and easy to try out different configurations
                with. 
            </p>
            <p>
                To properly understand everything at work here, I suggest reading Inigo 
                Quilez <a target="_blank" rel="noreferrer" href="https://www.iquilezles.org/www/articles/warp/warp.htm">blog post</a> on the topic, 
                or my own <a target="_blank" rel="noreferrer" href="https://palmdrop.github.io/post/domain-warping/">blog post</a>, 
                where I discuss the specific variant of this technique used on this page. I also suggest reading 
                about <a target="_blank" rel="noreferrer" href="https://en.wikipedia.org/wiki/Simplex_noise">Simplex Noise</a>, which is used
                as an underlying function of space for both the source function and the functions that alter its domain. 
            </p>
            <p>
                There's a lot of settings available to you. They might be overwhelming or incomprehensible. The best way to learn what they 
                do is to study the links from the previous paragraph, or just play around with them. If you want more information about what
                the obscure sliders actually do, press the "Show Tooltips" button in the upper right corner. Some information about each slider 
                or button will be displayed when you hover the mouse over it. 
            </p>
            <p>
                In the top bar, there are buttons for saving a frame, for exporting or importing the current settings, among other things.
                Feel free to post your creations anywhere you like. But do provide a link to this site if you do. Please note that this application
                works best on modern browsers with support for WebGL2.
            </p>
            <p>
                There also exist a 3D mode, where the texture is converted to a 3D height map. See more information below.
            </p>
            </div>
        )
    }, 
    {
        title: "Texture",
        content: (
            <div>
            <p>
                The <i>texture controller</i> changes the characteristics of the underlying noise functions, as well as the warp effect itself. 
                The <i>warp amount</i> controls the strength of the effect. The <i>iterations</i> is the number of times the warp is applied. The <i>source</i>
                is the noise function whos domain is sampled. The <i>angle controller</i> controls the angle of the warp effect, across space, and the
                <i>amount controller</i> controls the strength of the warp effect. Each layer has sliders for controlling fractal noise settings (layers of noise). 
            </p>  
            <p>
                I suggest reading <a target="_blank" rel="noreferrer" href="https://palmdrop.github.io/post/characteristics-of-modified-noise/">this post</a>. 
                It also covers some of the <i>modifications</i> available.
            </p>
            </div>
        )
    },
    {
        title: "Color",
        content: (
            <div>
            <p>
                The <i>color controller</i> gives precise control over the colors. There are
                some (hopefully) self-explanatory <i>general</i> sliders, but also more specific controllers for hue, saturation and brightness. Each of 
                these sub-controllers allows you to choose which layers (source, angle, and amount) will influence that part of the color. 
                For example, you might want the source layer to increase brightness, while the angle layer decreases it.
            </p>
            <p>
                As a side effect, this might make the <i>source</i> layer have varying influence over the final color. Do not be surprised if altering
                the <i>source</i> settings in the <i>texture</i> category does not change the results much. This is likely due to your <i>color</i> settings.
            </p>
            </div>
        )
    },
    {
        title: "Render",
        content: (
            <div>
            <p>
                The <i>render controller</i> gives you the ability to change resolution, control dithering, and multisampling.
                There's also an option to record the animation. Unfortunately, there's not yet support for converting the recorded
                frames into a video. Instead, you'll receive a zipped archive of PNG images. 
            </p>
            </div>
        )
    },
    {
        title: "3D",
        content: (
            <div>
            <p>
                The <i>3D controller</i> controls the 3D mode of the application. The 3D mode displays the domain warp texture as 
                a 3D height map that is lit by a set of lights. The material of the height map can be modified using a set of sliders,
                as well as the height of the peaks, the lighting and the background fog.
            </p>
            </div>
        )
    }
];

const contact=[{
        title: "Development",
        entries: [
            { 
            link: githubLink,
            location: "Github", 
            icon: githubIcon,
            description: "where I store my projects and configuration files"},
            { 
            link: repositoryLink,
            location: "Repository", 
            icon: repositoryIcon,
            description: "where you can find the source code for this app"
            }
        ]
    },
    {
        title: "Social Media",
        entries: [
            { 
            link: instagramLink,
            location: "Instagram", 
            icon: instagramIcon,
            description: "where I post generative art and experiments"},
            { 
            link: blogLink,
            location: "Blog", 
            icon: blogIcon,
            description: "where I (occassionally) document my techniques"
            }
        ]
    },
    {
        title: "Contact",
        entries: [
            { 
            link: emailLink,
            location: "Email", 
            icon: emailIcon,
            description: "with which you can reach me if you have questions"},
        ]
    }
];


// Help popup to display descriptions, keyboard shortcuts, contact/links and so on
const HelpPage = ({mainTitle, shortcuts, visibility, page, onCloseCallback}) => {
    // The current visible stage
    const [currentPage, setCurrentPage] = useState(0);
    const max = 2; 

    useEffect(() => {
        if(page) setCurrentPage(page);
    }, [page]);

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
                <h2 className="title">{mainTitle}</h2>
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
                                {entry.icon ? <img className="icon" src={entry.icon} alt="" /> : null} 
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
